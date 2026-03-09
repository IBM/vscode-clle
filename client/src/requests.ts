import { Uri } from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';

export async function getModules(client: LanguageClient, uri: Uri, content: string): Promise<any> {
	return await client.sendRequest(`getModules`, [uri.toString(), content]);
}