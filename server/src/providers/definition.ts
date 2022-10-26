import { CLParser, Module, Variable, DefinitionType, Statement, Subroutine, Token } from 'language';
import { CompletionItem, CompletionItemKind, CompletionParams, Definition, DefinitionParams, Location, Range } from 'vscode-languageserver';
import { CLModules } from '../data';
import { documents } from '../instance';

export default function definitionProvider(params: DefinitionParams): Location|undefined {
	const uri = params.textDocument.uri;
	const document = documents.get(uri);

	if (!document) {
		return;
	}

	const module = CLModules[document.uri];

	const token = module.getTokenByOffset(document.offsetAt(params.position));

	if (!token) {
		return;
	}

	const statement = module.getDefinition<Statement>(token.value!);
	
	if (statement) {
		let nameToken: Token|undefined;
		
		if (statement instanceof Variable){
			nameToken = (statement as Variable).name;
		}

		if (statement instanceof Subroutine){
			nameToken = (statement as Subroutine).name;
		}

		if (nameToken) {
			return Location.create(
				uri,
				Range.create(
					document.positionAt(nameToken.range.start),
					document.positionAt(nameToken.range.end)
				)
			)
		}
		
	}
}
