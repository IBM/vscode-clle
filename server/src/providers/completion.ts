import { Variable, DefinitionType, Subroutine, File } from 'language';
import { CompletionItem, CompletionItemKind, CompletionParams, InsertTextFormat, MarkupKind } from 'vscode-languageserver';
import { CLModules, getCLspec, getFileSpecCache, getCLDocSpec } from '../data';
import { documents } from '../instance';
import { buildDescription, columnDescription } from '../utils';

interface CompletionData {
	commandName: string;
	commandLibrary: string;
	name: string;
}

export async function completionProvider(params: CompletionParams): Promise<CompletionItem[]> {
	const position = params.position;
	const document = documents.get(params.textDocument.uri);
	const triggerCharacter = params.context ? params.context.triggerCharacter || `` : ``;

	let items: CompletionItem[] = [];

	if (document) {
		const module = CLModules[document.uri];

		const subroutines = module.getDefinitionsOfType<Subroutine>(DefinitionType.Subroutine);
		items.push(...subroutines
			.filter(subroutine => subroutine.name !== undefined)
			.map(subroutine => {
				const name = subroutine.name?.value;
				const item = CompletionItem.create(name!);
				item.kind = CompletionItemKind.Function;
				return item;
			}));

		const offset = document.offsetAt(position);
		const statement = module.getStatementByOffset(offset);
		if (statement) {
			const command = statement.getObject();
			if (command) {
				const spec = await getCLspec(command.name, command.library);

				// Parms in the existing statement
				const currentParms = statement.getParms();

				// Parms where cursor is
				const currentParm = Object.keys(currentParms).find(parmKey => {
					const block = currentParms[parmKey];
					return (offset >= block.range.start && offset <= block.range.end);
				})

				// If we are inside a parameter, show the special values
				if (currentParm) {
					const localVariables = module.getDefinitionsOfType<Variable>(DefinitionType.Variable);
					items.push(...localVariables
						.filter(variable => variable.name !== undefined)
						.map(variable => {
							const token = variable.name || { value: `` };
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

					const files = module.getDefinitionsOfType<File>(DefinitionType.File);
					files.forEach(def => {
						if (def.file) {
							const qualifiedObject = def.file;

							const fileItem = CompletionItem.create(qualifiedObject.name);
							fileItem.kind = CompletionItemKind.File;
							fileItem.detail = buildDescription(def);
							items.push(fileItem);

							const columns = getFileSpecCache(def.file.name, def.file.library, def.getOpenID());
							if (columns) {
								items.push(...columns.map(column => {
									const subItem = CompletionItem.create(column.name);
									subItem.kind = CompletionItemKind.Field;
									subItem.detail = columnDescription(column);
									return subItem;
								}));
							}
						}
					});

					if (spec) {
						const { parms, commandInfo } = spec;
						const singleParm = parms.find((parm: any) => parm.keyword === currentParm);
						if (singleParm) {
							const specialValues: string[] = singleParm.specialValues;
							items.push(
								...specialValues.map(specialValue => {
									const item = CompletionItem.create(specialValue);
									item.kind = CompletionItemKind.Property;
									return item;
								})
							);
						}
					}

				} else {

					if (spec) {
						const { parms, commandInfo } = spec;
						// We don't want to show parms that the user is already using
						const existingParms: string[] = Object.keys(currentParms);
						const availableParms: any[] = parms.filter((parm: any) => !existingParms.includes(parm.keyword));

						if (availableParms.length > 0) {
							const item = CompletionItem.create(`All parameters`);
							item.kind = CompletionItemKind.Interface;
							item.insertTextFormat = InsertTextFormat.Snippet;
							item.insertText = availableParms.map((parm: any, idx: number) => `${parm.keyword}(\${${idx + 1}:})`).join(` `) + `\$0`;
							item.detail = commandInfo.prompt;
							items.push(item);
						}

						items.push(
							...availableParms.map(parm => {
								const item = CompletionItem.create(parm.keyword);
								item.kind = CompletionItemKind.TypeParameter;
								item.insertTextFormat = InsertTextFormat.Snippet;
								item.insertText = `${parm.keyword}(\${1:})\$0`;
								item.detail = parm.prompt + ` ${parm.type ? `(${parm.choice || parm.type})` : ``}`.trimEnd();

								item.data = {
									commandName: command.name.toUpperCase(),
									commandLibrary: command.library,
									name: parm.keyword
								} as CompletionData;

								return item;
							})
						);
					}
				}
			}
		}
	}

	return items;
}

export async function completionResolveProvider(item: CompletionItem): Promise<CompletionItem> {
	const data: CompletionData = item.data;

	if (data && data.commandName && data.name) {
		const clDoc = await getCLDocSpec(data.commandName, data.commandLibrary);

		if (clDoc) {
			const parameterDoc = clDoc.doc.parameters.details.find(p => p.name === data.name);
			if (parameterDoc && parameterDoc.description) {
				// Remove the heading pattern: ### Parameter\n\n
				const description = parameterDoc.description.replace(/^###[^\n]*\n\n/, '');

				item.documentation = {
					kind: MarkupKind.Markdown,
					value: description
				};
			}
		}
	}

	return item;
}