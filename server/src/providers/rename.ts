import { CLParser, DefinitionType, Module, Token, Variable } from 'language';
import { ParameterStructures, PrepareRenameParams, Range, RenameParams, TextEdit, WorkspaceEdit } from 'vscode-languageserver';
import { CLModules } from '../data';
import { documents } from '../instance';

export function prepareRenameProvider(params: PrepareRenameParams): {range: Range, placeholder: string}|undefined {
	const uri = params.textDocument.uri;
	const document = documents.get(uri);

	if (!document) {
		return;
	}

	const module = CLModules[document.uri];

	const offset = document.offsetAt(params.position);

	let nameToken: Token|undefined;
	const token = module.getTokenByOffset(offset);

	if (token && token.type === `variable`) {
		nameToken = token;
	} else {
		const statement = module.getStatementByOffset(offset);

		if (statement && statement.type === DefinitionType.Variable) {
			nameToken = (statement as Variable).name;
		}
	}

	if (nameToken) {
		return {
			range: Range.create(
				document.positionAt(nameToken.range.start),
				document.positionAt(nameToken.range.end)
			),
			placeholder: nameToken.value || `newName`
		}
	}

	return;
}

export function renameProvider(params: RenameParams): WorkspaceEdit|undefined {
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

	const variable = module.getDefinition<Variable>(token.value!);

	if (variable && variable.type === DefinitionType.Variable) {
		const references = module.getReferences(variable);

		const edits: TextEdit[] = references.map(ref => ({
			newText: params.newName,
			range: Range.create(
				document.positionAt(ref.start),
				document.positionAt(ref.end)
			)
		}));

		const workspaceEdit: WorkspaceEdit = {
			changes: {
				[document.uri]: edits
			}
		}

		return workspaceEdit;
	}
	
}