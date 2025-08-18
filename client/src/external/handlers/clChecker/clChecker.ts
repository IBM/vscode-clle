
import * as vscode from 'vscode';
import { posix } from 'path';

// import IBMi from "@halcyontech/vscode-ibmi-types/api/IBMi";
import { CodeForIBMi } from "@halcyontech/vscode-ibmi-types";
import { getInstance } from './base';

import IBMi from "@halcyontech/vscode-ibmi-types/api/IBMi";

import { getCLCheckerCPPSrc } from './getCLCheckerCPPSrc';
import { getCLCheckerUDTFSrc } from './getCLCheckerUDTFSrc';

export interface ClSyntaxError {
  msgid: string,
  msgtext: string,
  cmdstring: string
}

const UDTF_NAME = 'CL_SYNTAX_CHECK';
const PGM_NAME = 'COZCLCHECK';
const VERSION = 1.0;
let tempLib = 'ILEDITOR';

export class CLStatementChecker {
  private getLibrary(config: any): string {
    if (config && config.tempLibrary) {
      return config.tempLibrary.toUpperCase();
    }
    return 'ILEDITOR';
  }

  private getTempDir(config: any): string {
    if (config && config.tempDir) {
      return config.tempDir;
    }
    return '/tmp';
  }

  async install(): Promise<boolean> {

    // TODO: Add base.ts from Liam.
    // getInstance()
    const instance = getInstance();
    const content = instance.getContent();
    const connection = instance.getConnection();

    if (!connection) return false;
    const config = connection.config;
    tempLib = this.getLibrary(config);
    const tempDir = this.getTempDir(config);  // Not used just for debug purposes

    if (!tempLib) return false;
    let success = true;
    const result = await this.checkCL_UDTFInstalled();  // Already installed and up to date

    if (result && result === true) return;

    await connection.withTempDirectory(async (tempDir: string) => {
      // Upload and create UDTF
      // Upload and compile C++ module
      const cppPath = posix.join(tempDir, `${PGM_NAME}.cpp`);
      console.log(`[clChecker] TempDir: ${tempDir}`);
      console.log(`[clChecker] CPP source uploaded to: ${cppPath}.`);
      const cppSource = getCLCheckerCPPSrc(tempLib, VERSION);
      const cppBytes = new TextEncoder().encode(cppSource);
      await content.writeStreamfileRaw(cppPath, cppBytes);

      const crtcppmod = `CRTCPPMOD MODULE(${tempLib}/${PGM_NAME}) SRCSTMF('${cppPath}') OUTPUT(*PRINT)`;
      console.log(`[clPrompter]: ${crtcppmod}`);
      const compileResult = await connection.runCommand({
        command: crtcppmod,
      });
      console.log(`[clChecker] CRTCPPMOD returned ${compileResult.code}`);
      if (compileResult.code !== 0) {
        success = false;
        return;
      }
      const crtExtPgm = `CRTPGM PGM(${tempLib}/${PGM_NAME}) MODULE(${tempLib}/${PGM_NAME}) ACTGRP(*CALLER)`;
      console.log(`[clChecker] Binding: ${crtExtPgm}`);
      const binderResult = await connection.runCommand({
        command: crtExtPgm,
      });
      console.log(`[clChecker] CRTPGM returned ${binderResult.code}`);
      if (binderResult.code !== 0) {
        success = false;
        return;
      }
      // Create the SQL UDTF from the uploaded source file (on the IFS)
      const sqlPath = posix.join(tempDir, `${UDTF_NAME}.sql`);
      console.log(`[clChecker] SQL UDTF ${UDTF_NAME} source is being uploaded to: ${sqlPath}.`);
      const sqlBytes = new TextEncoder().encode(getCLCheckerUDTFSrc(tempLib, VERSION));
      await content.writeStreamfileRaw(sqlPath, sqlBytes);
      console.log(`[clChecker] SQL UDTF ${UDTF_NAME} source was uploaded to: ${sqlPath}.`);
      const sqlResult = await connection.runCommand({
        command: `RUNSQLSTM SRCSTMF('${sqlPath}') COMMIT(*NONE) NAMING(*SYS)`,
      });
      console.log(`[clChecker] RUNSQLSTM for ${UDTF_NAME} returned ${sqlResult.code}`);
      if (sqlResult.code !== 0) {
        success = false;
        return;
      }

    });
    return success;
  }

  private escapeForSQL(clStmt: string): string {
    // Double up any single quotes for SQL compatibility
    return clStmt.replace(/'/g, "''");
  }
  async checkCL_UDTFInstalled(): Promise<boolean> {
    const instance = getInstance();
    const content = instance.getContent();
    const connection = instance.getConnection();

    if (!connection) return null;
    const config = connection.config;
    const tempLib = this.getLibrary(config);

    const results = await content.runSQL(
      [
        `select '1' as SUCCESS,`,
        `LONG_COMMENT`,
        `from qsys2.sysRoutines`,
        `WHERE SPECIFIC_SCHEMA = '${tempLib}' and ROUTINE_NAME = '${UDTF_NAME}'`
      ].join(" ")
    );

    // the above await to check SYSROUTINS seems to take a bit too long
    // so I do a short delay here of 3 seconds just to give it a moment.
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('[clChecker] UDTF results:', results);

    if (!results || results.length === 0) return false;

    const longComment = results[0].LONG_COMMENT as string;
    // Extract version number at the start (e.g., "1.0" or "1")
    const match = longComment.match(/^(\d+(\.\d+)?)/);
    const foundVersion = match ? parseFloat(match[1]) : 0;

    return results[0].SUCCESS === '1' && foundVersion >= VERSION;
  }

  async check(clStmt: string): Promise<ClSyntaxError[] | undefined> {
    const instance = getInstance();
    const content = instance.getContent();
    const connection = instance.getConnection();

    if (!connection) return null;
    const config = connection.config;
    const tempLib = this.getLibrary(config);

    const escapedStmt = this.escapeForSQL(clStmt);
    const cmd = [
      `select MSGID, MSGTEXT, CMDSTRING`,
      `from table(${tempLib}.${UDTF_NAME}('${escapedStmt}'))`
    ].join(" ");
    console.log(`[clChecker] checking: ${cmd}`);

    const results = await content.runSQL(cmd);

    console.log('[clChecker] UDTF results:', results);
    return results.map(result => ({
      msgid: result.MSGID,
      msgtext: result.MSGTEXT,
      cmdstring: result.CMDSTRING
    } as ClSyntaxError));
  }
}

