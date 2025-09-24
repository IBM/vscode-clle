import { ExtensionContext, commands, Uri } from 'vscode';
import { LanguageClient } from 'vscode-languageclient';
import { getCache } from './requests';

export function registerCommands(context: ExtensionContext, client: LanguageClient) {
  context.subscriptions.push(
    commands.registerCommand(`vscode-clle.server.getCache`, (uri: Uri) => {
      return getCache(client, uri);
    })
  )
}