
import { ComponentIdentification, ComponentState, IBMiComponent } from "@halcyontech/vscode-ibmi-types/api/components/component";
import IBMi from '@halcyontech/vscode-ibmi-types/api/IBMi';
import { getCLCheckerCPPSrc } from './cppSource';
import { getCLCheckerUDTFSrc } from './udtfSource';
import { getComponentRegistry, getInstance } from '../../api/ibmi';
import { posix } from 'path';
import { ExtensionContext } from 'vscode';

export interface ClSyntaxError {
  msgid: string,
  msgtext: string,
  cmdstring: string
}

export class CLSyntaxChecker implements IBMiComponent {
  static ID = "CLSyntaxChecker";
  static UDTF_NAME = 'CL_SYNTAX_CHECK';
  static PGM_NAME = 'COZCLCHECK';
  static CHECK_INTERVAL = 1500;
  static MAX_DOCUMENT_LENGTH = 32740;
  private readonly currentVersion = 1.1;
  private library: string | undefined;

  getIdentification(): ComponentIdentification {
    return { name: CLSyntaxChecker.ID, version: this.currentVersion };
  }

  static get(): CLSyntaxChecker | undefined {
    const instance = getInstance();
    const connection = instance?.getConnection();
    return connection?.getComponent<CLSyntaxChecker>(CLSyntaxChecker.ID);
  }

  async getRemoteState(connection: IBMi, installDirectory: string): Promise<ComponentState> {
    const library = this.getLibrary(connection);

    const udtfVersion = await CLSyntaxChecker.getVersionOf(connection, library!, CLSyntaxChecker.UDTF_NAME);
    if (udtfVersion < this.currentVersion) {
      return `NeedsUpdate`;
    }

    return `Installed`;
  }

  static registerComponent(context: ExtensionContext) {
    const clSyntaxChecker = new CLSyntaxChecker();
    const componentRegistry = getComponentRegistry();
    componentRegistry?.registerComponent(context, clSyntaxChecker);
  }

  async update(connection: IBMi, installDirectory: string): Promise<ComponentState> {
    return await connection.withTempDirectory(async (tempDir: string) => {
      const content = connection.getContent();
      const textEncoder = new TextEncoder();
      const library = this.getLibrary(connection);

      // Upload C++ source
      const cppPath = posix.join(tempDir, `${CLSyntaxChecker.PGM_NAME}.cpp`);
      const cppSource = getCLCheckerCPPSrc();
      const cppBytes = textEncoder.encode(cppSource);
      await content.writeStreamfileRaw(cppPath, cppBytes);

      // Create C++ module
      const crtcppmod = `CRTCPPMOD MODULE(${library}/${CLSyntaxChecker.PGM_NAME}) SRCSTMF('${cppPath}') DBGVIEW(*LIST) LANGLVL(*EXTENDED0X) OUTPUT(*PRINT)`;
      const compileResult = await connection.runCommand({
        command: crtcppmod,
        noLibList: true
      });
      if (compileResult.code !== 0) {
        return `Error`;
      }

      // Create C++ program
      const crtExtPgm = `CRTPGM PGM(${library}/${CLSyntaxChecker.PGM_NAME}) MODULE(${library}/${CLSyntaxChecker.PGM_NAME}) ACTGRP(*CALLER)`;
      const binderResult = await connection.runCommand({
        command: crtExtPgm,
        noLibList: true
      });
      if (binderResult.code !== 0) {
        return `Error`;
      }

      // Upload UDTF source
      const sqlPath = posix.join(tempDir, `${CLSyntaxChecker.UDTF_NAME}.sql`);
      const sqlSource = getCLCheckerUDTFSrc(library!, this.currentVersion);
      const sqlBytes = textEncoder.encode(sqlSource);
      await content.writeStreamfileRaw(sqlPath, sqlBytes);

      // Create UDTF
      const sqlResult = await connection.runCommand({
        command: `RUNSQLSTM SRCSTMF('${sqlPath}') COMMIT(*NONE) NAMING(*SYS)`,
        noLibList: true
      });
      if (sqlResult.code !== 0) {
        return `Error`
      }

      return `Installed`;
    });
  }

  reset?(): void | Promise<void> {
    // This is called when connecting to a new system.
    this.library = undefined;
  }

  async check(clStmt: string): Promise<ClSyntaxError[] | undefined> {
    const instance = getInstance();
    const connection = instance?.getConnection();

    if (!connection) {
      return undefined;
    }

    // Double up any single quotes for SQL compatibility
    const escapedStmt = clStmt.replace(/'/g, "''");

    // Run the UDTF
    const library = this.getLibrary(connection);
    const cmd = [
      `select MSGID, MSGTEXT, CMDSTRING`,
      `from table(${library}.${CLSyntaxChecker.UDTF_NAME}('${escapedStmt}', CHECKOPT=>'*CLLE'))`
    ].join(" ");

    const results = await connection.runSQL(cmd);
    return results.map(result => ({
      msgid: result.MSGID,
      msgtext: result.MSGTEXT,
      cmdstring: result.CMDSTRING
    } as ClSyntaxError));
  }

  private getLibrary(connection: IBMi) {
    if (!this.library) {
      const config = connection?.getConfig();
      this.library = config?.tempLibrary.toUpperCase() || `ILEDITOR`;
    }

    return this.library;
  }

  static async getVersionOf(connection: IBMi, schema: string, name: string) {
    const [result] = await connection.runSQL(`select cast(LONG_COMMENT as VarChar(200)) LONG_COMMENT from qsys2.sysroutines where routine_schema = '${schema}' and routine_name = '${name}'`);
    if (result?.LONG_COMMENT) {
      const comment = String(result.LONG_COMMENT);
      const dash = comment.indexOf('-');
      if (dash > -1) {
        return Number(comment.substring(0, dash).trim());
      }
    }

    return -1;
  }
}