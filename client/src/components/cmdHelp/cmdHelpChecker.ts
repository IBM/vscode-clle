/**
 * CmdHelpChecker — IBMiComponent that installs and maintains the CMD_HELP UDTF
 * in the connection's `tempLibrary` (e.g. ILEDITOR).
 *
 * CMD_HELP is a SQL Table Function that wraps the IBM i QUHRHLPT API via a small
 * C++ service program (CMDHELP). It returns HTML help text for an individual CL
 * command or a specific parameter keyword, making it far faster than running
 * GENCMDDOC (which generates a full HTML document, writes it to the IFS, and
 * requires the Db2 for i JVM to be warm).
 *
 * Signature:
 *   CMD_HELP(library VARCHAR(10), cmd VARCHAR(10), helpid VARCHAR(6000))
 *   RETURNS TABLE (HELP_XML CLOB(16M))
 *
 * Pass the command name as helpid for command-level help, or a parameter keyword
 * (e.g. 'MSGID') for parameter-level help.  Despite the column name HELP_XML, the
 * returned data is HTML.
 *
 * Registration:
 *   Call CmdHelpChecker.registerComponent(context) during extension activation.
 *   Code for IBM i will then call getRemoteState()/update() automatically each time
 *   a connection is established, installing or upgrading the UDTF as needed.
 *
 * @author BobCozzi
 */
import { ComponentIdentification, ComponentState, IBMiComponent } from "@halcyontech/vscode-ibmi-types/api/components/component";
import IBMi from '@halcyontech/vscode-ibmi-types/api/IBMi';
import { getComponentRegistry, getInstance } from '../../api/ibmi';
import { posix } from 'path';
import { ExtensionContext } from 'vscode';
import { getCmdHelpCPPSrc } from './cmdHelpCppSource';
import { getCmdHelpSQLSrc } from './cmdHelpSqlSource';

export class CmdHelpChecker implements IBMiComponent {
	static ID = 'CmdHelpChecker';
	static PGM_NAME = 'CMDHELP';
	static SPECIFIC_NAME = 'cmd_help';
	private readonly currentVersion = 1;
	private library: string | undefined;

	getIdentification(): ComponentIdentification {
		return { name: CmdHelpChecker.ID, version: this.currentVersion };
	}

	static async get(): Promise<CmdHelpChecker | undefined> {
		const instance = getInstance();
		const connection = instance?.getConnection();
		return await connection?.getComponent<CmdHelpChecker>(CmdHelpChecker.ID);
	}

	private getLibrary(connection: IBMi): string {
		if (!this.library) {
			const config = connection.getConfig();
			this.library = config?.tempLibrary?.toUpperCase() || 'ILEDITOR';
		}
		return this.library;
	}

	async getRemoteState(connection: IBMi, _installDirectory: string): Promise<ComponentState> {
		const library = this.getLibrary(connection);
		const version = await CmdHelpChecker.getVersionOf(connection, library, CmdHelpChecker.SPECIFIC_NAME);
		return version >= this.currentVersion ? 'Installed' : 'NeedsUpdate';
	}

	static registerComponent(context: ExtensionContext) {
		const checker = new CmdHelpChecker();
		const componentRegistry = getComponentRegistry();
		componentRegistry?.registerComponent(context, checker);
	}

	async update(connection: IBMi, _installDirectory: string): Promise<ComponentState> {
		return await connection.withTempDirectory(async (tempDir: string) => {
			const content = connection.getContent();
			const textEncoder = new TextEncoder();
			const library = this.getLibrary(connection);

			// Upload C++ source
			const cppPath = posix.join(tempDir, `${CmdHelpChecker.PGM_NAME}.cpp`);
			const cppBytes = textEncoder.encode(getCmdHelpCPPSrc());
			await content.writeStreamfileRaw(cppPath, cppBytes);

			// Compile C++ module
			const createModuleResult = await connection.runCommand({
				command: `CRTCPPMOD MODULE(${library}/${CmdHelpChecker.PGM_NAME}) SRCSTMF('${cppPath}') LANGLVL(*EXTENDED0X) SYSIFCOPT(*IFS64IO) OUTPUT(*PRINT)`,
				noLibList: true
			});
			if (createModuleResult.code !== 0) {
				return 'Error';
			}

			// Link program
			const createProgramResult = await connection.runCommand({
				command: `CRTPGM PGM(${library}/${CmdHelpChecker.PGM_NAME}) MODULE(${library}/${CmdHelpChecker.PGM_NAME}) ACTGRP(*CALLER)`,
				noLibList: true
			});
			if (createProgramResult.code !== 0) {
				return 'Error';
			}

			// Upload SQL DDL
			const sqlPath = posix.join(tempDir, `${CmdHelpChecker.SPECIFIC_NAME}.sql`);
			await content.writeStreamfileRaw(sqlPath, textEncoder.encode(getCmdHelpSQLSrc(library, this.currentVersion)));

			// Drop existing specific function (ignore error — may not exist yet)
			try {
				await connection.runSQL(`DROP SPECIFIC FUNCTION ${library}.${CmdHelpChecker.SPECIFIC_NAME}`);
			} catch {
				// expected when UDTF doesn't exist yet
			}

			// Create UDTF
			const createUdtfResult = await connection.runCommand({
				command: `RUNSQLSTM SRCSTMF('${sqlPath}') COMMIT(*NONE) NAMING(*SYS)`,
				noLibList: true
			});
			if (createUdtfResult.code !== 0) {
				return 'Error';
			}

			return 'Installed';
		});
	}

	reset?(): void {
		this.library = undefined;
	}

	static async getVersionOf(connection: IBMi, schema: string, specificName: string): Promise<number> {
		const [result] = await connection.runSQL(
			`SELECT CAST(LONG_COMMENT AS VARCHAR(200)) AS LONG_COMMENT ` +
			`FROM qsys2.sysroutines ` +
			`WHERE ROUTINE_SCHEMA = '${schema.toUpperCase()}' ` +
			`  AND SPECIFIC_NAME = '${specificName.toUpperCase()}'`
		);
		if (result?.LONG_COMMENT) {
			const comment = String(result.LONG_COMMENT);
			const dash = comment.indexOf('-');
			if (dash > -1) {
				const v = Number(comment.substring(0, dash).trim());
				if (!isNaN(v)) { return v; }
			}
		}
		return -1;
	}
}
