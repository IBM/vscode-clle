
import * as vscode from 'vscode';
import { posix } from 'path';

import IBMi from "@halcyontech/vscode-ibmi-types/api/IBMi";
import { CodeForIBMi } from "@halcyontech/vscode-ibmi-types";

import { getCLCheckerCPPSrc } from './getCLCheckerCPPSrc';
import { getCLCheckerUDTFSrc } from './getCLCheckerUDTFSrc';

export interface ClSyntaxError {
  msgid: string;
  text: string;
}

const UDTF_NAME = 'QCAPCMD';
const PGM_NAME = 'COZ_CAPCMD';
const VERSION = 1.0;

export class CLStatementChecker {
  private getLibrary(): string | undefined {
    return vscode.workspace.getConfiguration('ibmi').get<string>('tempLibrary')?.toUpperCase() || 'ILEDITOR';
  }

  async install(): Promise<boolean> {

    // TODO: Add base.ts from Liam.
    // getInstance()
    const { instance } = vscode.extensions.getExtension(`halcyontechltd.code-for-ibmi`).exports;
    const connection = instance.getConnection();
    if (!connection) return false;

    const lib = this.getLibrary();
    if (!lib) return false;

    return connection.withTempDirectory(async (tempDir: string) => {
      // Upload and create UDTF

      // Upload and compile C++ module
      const cppPath = posix.join(tempDir, `${PGM_NAME}.cpp`);
      console.log(`[clChecker] Uploading CL Syntax Checker C++ source to ${lib}.`);
      await connection (cppPath, Buffer.from(getCLCheckerCPPSrc(lib, VERSION), 'utf-8'));

      console.log(`[clChecker] Compiling: CRTCPPMOD MODULE(${lib}/${PGM_NAME}) SRCSTMF('${cppPath}.cpp')`);
      const compileResult = await connection.runCommand({
        command: `CRTCPPMOD MODULE(${lib}/${PGM_NAME}) SRCSTMF('${cppPath}.cpp') OUTPUT(*PRINT) DBGVIEW(*SOURCE)`,
      });
      console.log(`[clChecker] CRTCPPMOD returned ${compileResult.code}`);
      if (compileResult.code !== 0)
      {
        return false;
      }
      console.log(`[clChecker] Binding: CRTPGM PGM(${lib}/${PGM_NAME}) MODULE${lib}/${PGM_NAME}) ACTGRP(*CALLER)`);
      const binderResult = await connection.runCommand({
        command: `CRTPGM PGM(${lib}/${PGM_NAME}) MODULE${lib}/${PGM_NAME}) ACTGRP(*CALLER)`,
      });
      if (binderResult.code !== 0)
      {
        return false;
      }

      console.log(`[clChecker] CRTPGM returned ${binderResult.code}`);
      console.log(`[clChecker] Uploading CL Syntax Checker UDTF SQL source to ${lib}.`);
      const sqlPath = posix.join(tempDir, `${UDTF_NAME}.sql`);
      await connection.writeStreamfileRaw(sqlPath, Buffer.from(getCLCheckerUDTFSrc(lib, VERSION), 'utf-8'));

      const sqlResult = await connection.runCommand({
        command: `RUNSQLSTM SRCSTMF('${sqlPath}') COMMIT(*NONE) NAMING(*SYS)`,
      });
      console.log(`[clChecker] RUNSQLSTM returned ${sqlResult.code}`);
      if (sqlResult.code !== 0) {
        return false;
      }

    });
  }

  async check(statement: string): Promise<ClSyntaxError | undefined> {
    const connection = await vscode.commands.executeCommand<any>('vscode-ibmi.getConnection');
    const currentJob = await vscode.commands.executeCommand<any>('vscode-ibmi.getCurrentJob');
    const lib = this.getLibrary();
    if (!connection || !currentJob || !lib) return;

    const sql = `SELECT * FROM TABLE(${lib}.${UDTF_NAME}(?)) X`;

    const result = await currentJob.job.execute(sql, { parameters: [statement] });

    if (!result.success || result.data.length === 0) return;

    const row = result.data[0];
    return {
      msgid: row.MSGID,
      text: row.MSGTEXT
    };
  }
}

