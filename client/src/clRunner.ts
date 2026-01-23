import { ExtensionContext, Position, Selection, commands, window } from "vscode";
import { getInstance } from './api/ibmi';
import { getCommandString } from './utils';

export function initialiseRunner(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(`vscode-clle.runSelected`, async () => {
			const instance = getInstance();
      const editor = window.activeTextEditor;

      if (editor) {
        const document = editor.document;

        if (document && document.languageId === `cl`) {
          const connection = instance.getConnection();

          if (connection) {
            const selectedCommand = getCommandString(editor.selection, document);
            
            if (selectedCommand.range) {
              editor.selection = new Selection(
                new Position(selectedCommand.range.start, 0), 
                new Position(selectedCommand.range.end, document.lineAt(selectedCommand.range.end).range.end.character)
              );
            }

            await commands.executeCommand(`code-for-ibmi.runAction`, editor.document.uri, undefined, {
              command: selectedCommand.content,
              environment: `ile`,
              name: `CL command`,
            });
          }
        }
      }
    })
  )
}