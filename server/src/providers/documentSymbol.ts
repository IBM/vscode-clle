import { CLParser, Module, Variable, DefinitionType, Statement, Subroutine, Token, File, DataType } from 'language';
import { CompletionItem, CompletionItemKind, CompletionParams, Definition, DefinitionParams, DocumentSymbol, DocumentSymbolParams, Location, Range , SymbolKind} from 'vscode-languageserver';
import { documents } from '../instance';
import { buildDescription, varDescription } from '../utils';


export default function documentSymbolProvider(params: DocumentSymbolParams): DocumentSymbol[]|undefined {
	const uri = params.textDocument.uri;
	const document = documents.get(uri);

	if (!document) {
		return;
	}

	const content = document.getText();
	const parser = new CLParser();
	const tokens = parser.parseDocument(content);
	const module = new Module();
	module.parseStatements(tokens);

	let symbols: DocumentSymbol[] = [];
	const defs = module.getDefinitions();
	defs.forEach(def => {
		let nameValue: string|undefined;
		let description: string|undefined;
		let kind: SymbolKind = SymbolKind.Variable;

		let statementRange: Range;
		let selectionRange: Range|undefined;

		if (def instanceof Variable && def.name) {
			nameValue = def.name?.value;
			kind = SymbolKind.Variable;
			selectionRange = Range.create(
				document.positionAt(def.name!.range.start),
				document.positionAt(def.name!.range.end),
			);

			description = buildDescription(def);
		} else

		if (def instanceof File && def.file) {
			nameValue = def.file?.name;
			kind = SymbolKind.File;
			description = buildDescription(def);
		} 
		else if (def instanceof Subroutine && def.name) {
			nameValue = def.name?.value;
			kind = SymbolKind.Function;
			selectionRange = Range.create(
				document.positionAt(def.name!.range.start),
				document.positionAt(def.name!.range.end),
			);
		}

		statementRange = Range.create(
			document.positionAt(def.range.start),
			document.positionAt(def.range.end),
		);

		if (!selectionRange) {
			selectionRange = statementRange;
		}

		if (nameValue) {
			const symbol = DocumentSymbol.create(nameValue, description, kind, statementRange, selectionRange);
			symbols.push(symbol);
		}
	})

	return symbols;
}
