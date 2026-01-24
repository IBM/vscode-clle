import { ExtensionContext, commands, Uri, window, ViewColumn } from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';
import { getModules } from './requests';
import { getCustomUI } from './api/ibmi';
import { CLDoc } from './gencmddoc';

export function registerCommands(context: ExtensionContext, client: LanguageClient) {
  context.subscriptions.push(
    commands.registerCommand(`vscode-clle.server.getModules`, async (uri: Uri, content: string) => {
      return await getModules(client, uri, content);
    }),

    commands.registerCommand(`vscode-clle.viewFullDocumentation`, async (object: string, library: string) => {
      const clDoc = await client.sendRequest<{ html: string, doc: CLDoc } | undefined>(`getCLDoc`, [object, library]);
      if (clDoc) {
        const panel = window.createWebviewPanel(`tab`, `${clDoc.doc.command.name} Documentation`, { viewColumn: ViewColumn.Active }, { enableScripts: true });
        panel.webview.html = clDoc.html;
        panel.reveal();
      } else {
        await window.showErrorMessage(`Documentation for ${object} command not found`);
      }
    })
  )
}