import { commands } from 'vscode';
import Handler from './handler';

import * as xml2js from "xml2js";

interface GetClDefinitionResponse {
	statusCode?: number,
	definition?: string,
	error?: string
}

export interface GetRecordFormatOutput {
	recordFormats?: object[];
	isSuccess: boolean;
	message?: string;
}

export default class Merlin extends Handler {
	constructor(public extensionId: string) {
		super(extensionId);
	}

	// Checks the extension is active
	async initialise(): Promise<boolean> {
		return this.backend ? true : false;
	}

	// Is run when prompted on a CL command
	async getCLDefinition(objectName: string, library = `*LIBL`): Promise<any> {
		const results = await this.genDefinition(objectName, library);

		return results;
	}
	
	async getFileDefinition(objectName: string, library = `*LIBL`): Promise<any> {
		const result: GetRecordFormatOutput = await commands.executeCommand(`ibmi.rseapi.getRecordFormats`, [library, objectName].join(`/`))

		if (result.recordFormats) {
			return result.recordFormats;
		}

		return;
	}

	private async genDefinition(objectName: string, library = `*LIBL`): Promise<any> {
		const result: GetClDefinitionResponse = await commands.executeCommand(`ibmi.rseapi.executeGetCLDefinition`, objectName, library);

		if (result.definition) {
			const commandData = await xml2js.parseStringPromise(result.definition);

			return commandData;
		}

		return;
	}
}