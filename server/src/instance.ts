import {
	createConnection,
	TextDocuments,
	ProposedFeatures,
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';
import { DetailedCommandDoc, Files } from './spec';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
export const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
export const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

export function getCLDefinition(object: string, library?: string): Promise<any | undefined> {
	return connection.sendRequest("getCLDefinition", [object, library]);
}

export function getFileDefinition(object: string, library?: string): Promise<Files.ColumnDescription[] | undefined> {
	return connection.sendRequest("getFileDefinition", [object, library]);
}

export function getCLDoc(object: string, library?: string): Promise<DetailedCommandDoc | undefined> {
	return connection.sendRequest("getCLDoc", [object, library]);
}