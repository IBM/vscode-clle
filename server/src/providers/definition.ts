import { CLParser, Module, Variable, DefinitionType } from 'language';
import Statement from 'language/src/statement';
import Subroutine from 'language/src/subroutine';
import { CompletionItem, CompletionItemKind, CompletionParams, Definition, DefinitionParams, Location, Range } from 'vscode-languageserver';
import { documents } from '../instance';

export default function definitionProvider(params: DefinitionParams): Location|undefined {
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

	const token = module.getTokenByOffset(document.offsetAt(params.position));

	if (!token) {
		return;
	}

	const variable = module.getDefinition<Variable>(token.value!);

	if (variable) {
		const startingToken = variable.tokens[0];
		const endingToken = variable.tokens[variable.tokens.length-1];

		return Location.create(
			uri,
			Range.create(
				document.positionAt(startingToken.range.start),
				document.positionAt(endingToken.range.end)
			)
		)
	} else {
		const subroutine = module.getDefinition<Subroutine>(token.value!);
		

	}
}
