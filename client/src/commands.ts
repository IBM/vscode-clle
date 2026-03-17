import { ExtensionContext, commands, Uri, window, ViewColumn } from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';
import { getModules } from './requests';
import { GenCmdDoc } from './gencmddoc';

export function registerCommands(context: ExtensionContext, client: LanguageClient) {
  context.subscriptions.push(
    commands.registerCommand(`vscode-clle.server.getModules`, async (uri: Uri, content: string) => {
      return await getModules(client, uri, content);
    }),

    commands.registerCommand(`vscode-clle.viewFullDocumentation`, async (object: string, library: string) => {
      try {
        const isDocOpened = await GenCmdDoc.openClDoc(object, library);
        if (!isDocOpened) {
          await window.showErrorMessage(`Documentation for ${object} command not found`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await window.showErrorMessage(`Failed to generate documentation: ${errorMessage}`);
      }
    })
  )
}