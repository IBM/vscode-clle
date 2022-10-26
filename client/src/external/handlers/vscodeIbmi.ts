import * as util from "util";

import Handler from './handler';

import * as xml2js from "xml2js";

export default class vscodeIbmi extends Handler {
	instance: any;
	installed: boolean = false;

	constructor(extensionId: string) {
		super(extensionId);
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

	async getCLDefinition(objectName: string, library = `*LIBL`): Promise<any> {
		const canRun = await this.canRun();
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

	private async canRun(): Promise<boolean> {
		if (this.hasConnection()) {
			const installed = await this.checkProgramInstalled();
			return installed;
		}

		return false;
	}

	private hasConnection(): boolean {
		if (this.instance && this.instance.connection) return true;
		return false;
	}

	private async checkProgramInstalled(): Promise<boolean> {
		if (this.installed) return true;
		if (this.instance) {
			// TODO...
			this.installed = true;
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
    const targetName = command.toUpperCase().padEnd(10);

    await connection.remoteCommand(`CALL PGM(${tempLib}/GENCMDXML) PARM('${targetName}' '${targetCommand}')`);

    const xml = await content.downloadStreamfile(`/tmp/${targetName}`);

    const commandData = await xml2js.parseStringPromise(xml);

    return commandData;
  }
}
