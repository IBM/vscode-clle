import { CLParser, DefinitionType, Module, Statement, Subroutine, Token, Variable } from 'language';
import { Location, ParameterStructures, PrepareRenameParams, Range, ReferenceParams, RenameParams, TextEdit, WorkspaceEdit } from 'vscode-languageserver';
import { CLModules } from '../data';
import { documents } from '../instance';

export function referencesProvider(params: ReferenceParams): Location[]|undefined {
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

	if (token && token.value) {
		const def = module.getDefinition<Variable|Subroutine>(token.value!);
		if (def) {
			const refs = module.getReferences(def);
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