import { ExtensionContext, commands, Uri } from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';
import { getModules } from './requests';

export function registerCommands(context: ExtensionContext, client: LanguageClient) {
  context.subscriptions.push(
    commands.registerCommand(`vscode-clle.server.getModules`, async (uri: Uri, content: string) => {
      return await getModules(client, uri, content);
    }),
    
    commands.registerCommand(`vscode-clle.viewFullDocumentation`, async (object: string, library: string) => {
      return;
    })
  )
}