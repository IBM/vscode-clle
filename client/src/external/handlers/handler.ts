import { Extension, extensions } from 'vscode';

export default class Handler {
	backend: Extension<any>;
	constructor(public extensionId: string) {
		this.backend = extensions.getExtension(extensionId);
	}

	// Checks the extension is active
	async initialise(): Promise<boolean> {
		return false;
	}

	// Is run when prompted on a CL command
	async getCLDefinition(objectName: string, library = `*LIBL`): Promise<string> {
		return;
	}
	
	async getFileDefinition(objectName: string, library = `*LIBL`): Promise<any> {
		return;
	}
}