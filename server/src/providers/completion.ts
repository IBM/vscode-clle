import { CLParser, Module, Variable, DefinitionType, Subroutine } from 'language';
import { CompletionItem, CompletionItemKind, CompletionParams } from 'vscode-languageserver';
import { documents } from '../instance';
import { buildDescription } from '../utils';

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
				const token = variable.name || {value: ``};
				// Take the & away if there is one.
				let name = token.value || ``;
				if (name.startsWith(triggerCharacter)) {
					name = name.substring(triggerCharacter.length);
				}

        const item = CompletionItem.create(name);
        item.kind = CompletionItemKind.Variable;
				item.detail = buildDescription(variable);
        return item;
      }));

		if (triggerCharacter.trim().length === 0) {
			const subroutines = module.getDefinitionsOfType<Subroutine>(DefinitionType.Subroutine);
			items.push(...subroutines
				.filter(subroutine => subroutine.name !== undefined)
				.map(subroutine => {
					const name = subroutine.name?.value;
					const item = CompletionItem.create(name!);
					item.kind = CompletionItemKind.Function;
					return item;
				}));
		}
  }

  return items;
}