import {
	createConnection,
	TextDocuments,
	ProposedFeatures,
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
export const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
export const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

export function getCLDefinition(object: string, library?: string): Promise<any|undefined> {
	return connection.sendRequest("getCLDefinition", [object, library]);
}