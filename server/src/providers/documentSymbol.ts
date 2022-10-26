import { CLParser, Module, Variable, DefinitionType, Statement, Subroutine, Token, File, DataType } from 'language';
import { CompletionItem, CompletionItemKind, CompletionParams, Definition, DefinitionParams, DocumentSymbol, DocumentSymbolParams, Location, Range , SymbolKind} from 'vscode-languageserver';
import { CLModules } from '../data';
import { documents } from '../instance';

const typeMap = {
	[DataType.Character]: 'Character',
	[DataType.Integer]: 'Integer',
	[DataType.Label]: 'Label',
	[DataType.Logical]: 'Logical',
	[DataType.Packed]: 'Decimal',
	[DataType.Pointer]: 'Pointer',
	[DataType.Subroutine]: 'Subroutine',
	[DataType.UInteger]: 'Unsigned Integer',
	[DataType.Unknown]: 'Unknown'
};

export default function documentSymbolProvider(params: DocumentSymbolParams): DocumentSymbol[]|undefined {
	const uri = params.textDocument.uri;
	const document = documents.get(uri);

	if (!document) {
		return;
	}

	const module = CLModules[document.uri];

	let symbols: DocumentSymbol[] = [];
	const defs = module.getDefinitions();
	defs.forEach(def => {
		let nameValue: string|undefined;
		let description: string|undefined;
		let kind: SymbolKind = SymbolKind.Variable;

		let statementRange: Range;
		let selectionRange: Range|undefined;

		if (def instanceof Variable) {
			// We check if def.name exists because they might literally be writing the statement
			if (def.name) {
				nameValue = def.name?.value;
				kind = SymbolKind.Variable;
				selectionRange = Range.create(
					document.positionAt(def.name!.range.start),
					document.positionAt(def.name!.range.end),
				);

				const varDesc = [];

				if (typeMap[def.dataType]) {
					varDesc.push(typeMap[def.dataType]);

					const parms = def.getParms();

					if (parms['LEN']) {
						const lenTokens = parms['LEN'];
						const parmVal = lenTokens
							.map(token => token.value)
							.join(`, `);
						varDesc.push(`(${parmVal})`);
					}
				}

				description = varDesc.join(' ');
			}
		} else

		if (def instanceof File) {
			if (def.file) {
				nameValue = def.file?.name;
				kind = SymbolKind.File;

				const openId = def.getOpenID();
				description = [
					[def.file.library, def.file.name].filter(v => v).join(`/`),
					openId ? `OPNID(${openId})` : undefined
				].filter(v => v).join(` `)
			}
		} else
		
		if (def instanceof Subroutine) {
			if (def.name) {
				nameValue = def.name?.value;
				kind = SymbolKind.Function;
				selectionRange = Range.create(
					document.positionAt(def.name!.range.start),
					document.positionAt(def.name!.range.end),
				);
			}
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
