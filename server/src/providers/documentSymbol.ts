import { CLParser, Module, Variable, DefinitionType, Statement, Subroutine, Token, File, DataType } from 'language';
import { CompletionItem, CompletionItemKind, CompletionParams, Definition, DefinitionParams, DocumentSymbol, DocumentSymbolParams, Location, Range, SymbolKind } from 'vscode-languageserver';
import { CLModules, getFileSpec, getFileSpecCache } from '../data';
import { documents } from '../instance';
import { buildDescription, columnDescription } from '../utils';


export default async function documentSymbolProvider(params: DocumentSymbolParams): Promise<DocumentSymbol[] | undefined> {
	const uri = params.textDocument.uri;
	const document = documents.get(uri);

	if (!document) {
		return;
	}

	const module = CLModules[document.uri];

	let symbols: DocumentSymbol[] = [];
	const defs = module.getDefinitions();
	const files = module.getDefinitionsOfType<File>(DefinitionType.File);

	// First, fetch all the files.
	await Promise.all(files
		.filter(def => {
			return def.file !== undefined && def.file.name !== undefined
		})
		.map(def => getFileSpec(def.file?.name!, def.file?.library))
	)

	defs.forEach(def => {
		let nameValue: string | undefined;
		let description: string | undefined;
		let kind: SymbolKind = SymbolKind.Variable;
		let children: DocumentSymbol[] | undefined;

		let selectionRange: Range | undefined;

		const statementRange = Range.create(
			document.positionAt(def.range.start),
			document.positionAt(def.range.end),
		);

		if (def instanceof Variable && def.name) {
			nameValue = def.name?.value;
			kind = SymbolKind.Variable;
			selectionRange = Range.create(
				document.positionAt(def.name!.range.start),
				document.positionAt(def.name!.range.end),
			);

			description = buildDescription(def);
		}

		else if (def instanceof File && def.file) {
			const qualifiedObject = def.file;

			nameValue = qualifiedObject.name;
			kind = SymbolKind.File;
			description = buildDescription(def);

			const columns = getFileSpecCache(def.file.name, def.file.library);
			if (columns) {
				children = columns.map(column => 
					DocumentSymbol.create(
						`&${column.name}`,
						columnDescription(column),
						SymbolKind.Property,
						statementRange,
						statementRange
					)
				);

			}
		}

		else if (def instanceof Subroutine && def.name) {
			nameValue = def.name?.value;
			kind = SymbolKind.Function;
			selectionRange = Range.create(
				document.positionAt(def.name!.range.start),
				document.positionAt(def.name!.range.end),
			);
		}

		if (!selectionRange) {
			selectionRange = statementRange;
		}

		if (nameValue) {
			const symbol = DocumentSymbol.create(nameValue, description, kind, statementRange, selectionRange, children);
			symbols.push(symbol);
		}
	})

	return symbols;
}
