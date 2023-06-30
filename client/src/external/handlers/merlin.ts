import { commands, extensions } from 'vscode';
import vscodeIbmi from './vscodeIbmi';

export interface GetRecordFormatOutput {
	recordFormats?: object[];
	isSuccess: boolean;
	message?: string;
}

export default class Merlin extends vscodeIbmi {
	static extensionId = `IBM.ibmideveloper`;

	constructor() {
		super();
	}

	// Check both extensions are active
	async initialise(): Promise<boolean> {
		const merlinBackend = extensions.getExtension(Merlin.extensionId);
		return await super.initialise() && (merlinBackend ? true : false);
	}

	async getFileDefinition(objectName: string, library = `*LIBL`): Promise<any> {
		const result: GetRecordFormatOutput = await commands.executeCommand(`ibmi.getRecordFormats`, [library, objectName].join(`/`))

		if (result.recordFormats) {
			return result.recordFormats;
		}

		return;
	}
}