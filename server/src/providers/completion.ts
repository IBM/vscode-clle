import { CLParser, Module, Variable, DefinitionType, Subroutine } from 'language';
import { CompletionItem, CompletionItemKind, CompletionParams } from 'vscode-languageserver';
import { CLModules } from '../data';
import { documents, getCLDefinition } from '../instance';
import { buildDescription } from '../utils';

export default async function completionProvider(params: CompletionParams): Promise<CompletionItem[]> {
	const position = params.position;
  const document = documents.get(params.textDocument.uri);
	const triggerCharacter = params.context ? params.context.triggerCharacter || `` : ``;

	let items: CompletionItem[] = [];

  if (document) {
    const module = CLModules[document.uri];

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

		const statement = module.getStatementByOffset(document.offsetAt(position));
		if (statement) {
			const command = statement.getObject();
			if (command) {
				const spec = await getCLDefinition(command.name, command.library);
			}
		}
  }

  return items;
}