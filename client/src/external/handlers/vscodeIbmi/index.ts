import Handler from '../handler';
import * as xml2js from "xml2js";
import { getInstance } from '../../api/ibmi';
import Instance from '@halcyontech/vscode-ibmi-types/api/Instance';

import { content as gencmdxml } from './gencmdxml';

enum Status {
	NotChecked,
	Installed,
	NotInstalled
};

export default class vscodeIbmi extends Handler {
	static extensionId = `halcyontechltd.code-for-ibmi`;
	static programName = `GENCMD2`;
	instance: Instance;
	installed: Status = Status.NotChecked;

	constructor() {
		super(vscodeIbmi.extensionId);
	}

	async initialise(): Promise<boolean> {
		if (this.backend) {
			const baseExtension = this.backend;
			const instance = (baseExtension && baseExtension.isActive && baseExtension.exports ? baseExtension.exports.instance : null);
			if (instance) {
				this.instance = instance;
				return true;
			}
		}

		return false;
	}

	async install(): Promise<boolean> {
		const instance = this.instance;
		const connection = instance.getConnection()!;
		const content = instance.getContent()!;
		const config = instance.getConfig()!;
	
		const tempLib = config.tempLibrary;
	
		//It may exist already so we just ignore the error
		await connection.runCommand({ command: `CRTSRCPF ${tempLib}/QTOOLS AUT(*ALL)`, noLibList: true })
	
		await content.uploadMemberContent(undefined, tempLib, `QTOOLS`, vscodeIbmi.programName, gencmdxml.join(`\n`));
		const createResult = await connection.runCommand({
			command: `CRTBNDCL PGM(${tempLib}/${vscodeIbmi.programName}) SRCFILE(${tempLib}/QTOOLS) DBGVIEW(*SOURCE) TEXT('vscode-ibmi xml generator for commands')`,
			noLibList: true
		});
	
		return createResult.code === 0;
	}

	/**
	 * Returns DSPFFD outfile rows
	 */
	async getFileDefinition(objectName: string, library?: string): Promise<any> {
		if (this.hasConnection()) {
			const validLibrary = library || `*LIBL`;
			const instance = this.instance;

			const content = instance.getContent();

			/** @type {Configuration} */
			const config = instance.getConfig();

			const dateStr = Date.now().toString().substr(-6);
			const randomFile = `R${objectName.substring(0, 3)}${dateStr}`.substring(0, 10);
			const fullPath = `${config.tempLibrary}/${randomFile}`;

			const ibmi = getInstance();
			const outfileRes = await ibmi.getConnection().runCommand({
				environment: `ile`,
				command: `DSPFFD FILE(${validLibrary}/${objectName}) OUTPUT(*OUTFILE) OUTFILE(${fullPath})`
			});

			console.log(outfileRes);
			const resultCode = outfileRes.code || 0;

			if (resultCode === 0) {
				const data: object[] = await content.getTable(config.tempLibrary, randomFile, randomFile, true);

				console.log(`Temp OUTFILE read. ${data.length} rows.`);

				return data;
			}
		}

		return;
	}

	async getCLDefinition(objectName: string, library = `*LIBL`): Promise<any> {
		const canRun = await this.canGetCL();
		if (canRun) {
			try {
				const results = await this.genDefinition(objectName, library);

				return results;
			} catch (e) {
				console.log(e);
			}
		}

		return;
	}

	private async canGetCL(): Promise<boolean> {
		if (this.hasConnection() && this.installed !== Status.NotInstalled) {
			const installed = await this.checkProgramInstalled();
			return installed;
		}

		return false;
	}

	private hasConnection(): boolean {
		if (this.instance && this.instance.getConnection()) return true;
		return false;
	}

	private async checkProgramInstalled(): Promise<boolean> {
		if (this.installed === Status.Installed) return true;
		if (this.instance) {
			const connection = this.instance.getConnection();
			const content = this.instance.getContent();
			const config = this.instance.getConfig();
			const tempLib = config.tempLibrary;

			const exists = await content.checkObject({ type: `*PGM`, library: tempLib, name: vscodeIbmi.programName});

			if (exists) {
				this.installed = Status.Installed;
				return true;
			}

			this.installed = Status.NotInstalled;
		}

		if (this.installed === Status.NotInstalled) {
			const installed = await this.install();
			if (installed) {
				this.installed = Status.Installed;
				return true;
			}
		}

		return false;
	}

	private async genDefinition(command, library = `*LIBL`) {
		const validLibrary = library || `*LIBL`;
		const instance = this.instance;

		/** @type {IBMi} */
		const connection = instance.getConnection();

		const content = instance.getContent();

		/** @type {Configuration} */
		const config = instance.getConfig();

		const tempLib = config.tempLibrary;

		const targetCommand = command.padEnd(10) + validLibrary.padEnd(10);
		const targetName = makeid();
		const resultingFile = `/tmp/${targetName}`;

		const callResult = await connection.runCommand({
			command: `CALL PGM(${tempLib}/${vscodeIbmi.programName}) PARM('${targetName}' '${targetCommand}')`,
		});

		if (callResult.code === 0) {
			console.log(callResult);

			try {
				const xml = (await content.downloadStreamfileRaw(resultingFile)).toString();

				connection.sendCommand({ command: `rm -rf ${resultingFile}` });
		
				const commandData = await xml2js.parseStringPromise(xml);
		
				return commandData;
			} catch (e) {
				console.log(`Command likely doesn't exist: ${targetCommand}: ${e.message}`);
			}
		}

		return undefined;
	}
}

export function makeid(length: number = 8) {
	let text = `O_`;
	const possible =
		`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`;

	for (let i = 0; i < length; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}