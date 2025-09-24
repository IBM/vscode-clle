import { Uri } from 'vscode';
import { LanguageClient } from 'vscode-languageclient';

export async function getCache(client: LanguageClient, uri: Uri): Promise<any> {
	return client.sendRequest(`getCache`, uri.toString());
}