import { ExtensionContext, commands, Uri } from 'vscode';
import { LanguageClient } from 'vscode-languageclient';
import { getModules } from './requests';
import { getHandler } from "./external";

export function registerCommands(context: ExtensionContext, client: LanguageClient) {
  context.subscriptions.push(
    commands.registerCommand(`vscode-clle.server.getModules`, async (uri: Uri, content: string) => {
      return await getModules(client, uri, content);
    }),
    commands.registerCommand(`vscode-clle.getCLDefinition`, async (object: string, library?: string) => {
          const handler = await getHandler();
          if (!handler) {
            throw new Error("IBM i handler not available");
          }
          const def = library ? await handler.getCLDefinition(object, library) : await handler.getCLDefinition('CPYF');
          return def;
    })
  )
}