import { CLParser, DefinitionType, Module, Token, Variable } from 'language';
import { Location, ParameterStructures, PrepareRenameParams, Range, ReferenceParams, RenameParams, TextEdit, WorkspaceEdit } from 'vscode-languageserver';
import { documents } from '../instance';

export function referencesProvider(params: ReferenceParams): Location[]|undefined {
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

	// TODO: support subroutines
	if (token && token.value && token.type === `variable`) {
		const variable = module.getDefinition<Variable>(token.value);
		if (variable){
			const refs = module.getReferences(variable);
			return refs.map(ref =>
				Location.create(
					document.uri,
					Range.create(
						document.positionAt(ref.start),
						document.positionAt(ref.end)
					)
				) 
			);
		}
	}
	
}