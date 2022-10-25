import { CLParser, Module, Variable, DefinitionType } from 'language';
import Subroutine from 'language/src/subroutine';
import { CompletionItem, CompletionItemKind, CompletionParams } from 'vscode-languageserver';
import { documents } from '../instance';

export default function completionProvider(params: CompletionParams): CompletionItem[] {
  const document = documents.get(params.textDocument.uri);
	const triggerCharacter = params.context ? params.context.triggerCharacter || `` : ``;
	
	let items: CompletionItem[] = [];

  if (document) {

    const content = document.getText();
    const parser = new CLParser();
    const tokens = parser.parseDocument(content);
    const module = new Module();
    module.parseStatements(tokens);

    const variables = module.getDefinitionsOfType<Variable>(DefinitionType.Variable);
    items.push(...variables
      .filter(variable => variable.name !== undefined)
      .map(variable => {
				// Take the & away if there is one.
				let name = variable.name || ``;
				if (name.startsWith(triggerCharacter)) {
					name = name.substring(triggerCharacter.length);
				}

        const item = CompletionItem.create(name);
        item.kind = CompletionItemKind.Variable;
        return item;
      }));

		if (triggerCharacter.length === 0) {
			const subroutines = module.getDefinitionsOfType<Subroutine>(DefinitionType.Subroutine);
			items.push(...subroutines
				.filter(subroutine => subroutine.name !== undefined)
				.map(subroutine => {
					const item = CompletionItem.create(subroutine.name!);
					item.kind = CompletionItemKind.Function;
					return item;
				}));
		}
  }

  return items;
}