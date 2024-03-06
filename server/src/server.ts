
import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
  CompletionParams,
	TextDocumentChangeEvent
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

import { connection, documents } from './instance';
import completionProvider from './providers/completion';
import definitionProvider from './providers/definition';
import documentSymbolProvider from './providers/documentSymbol';
import { renameProvider, prepareRenameProvider } from './providers/rename';
import { referencesProvider } from './providers/reference';
import { CLParser, Module } from 'language';
import { CLModules } from './data';


let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				triggerCharacters: [`&`, `(`]
			},
			definitionProvider: true,
			documentSymbolProvider: true,
			renameProvider: {
				prepareProvider: true
			},
			referencesProvider: true
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

connection.onCompletion(completionProvider);
connection.onDefinition(definitionProvider);
connection.onDocumentSymbol(documentSymbolProvider);
connection.onPrepareRename(prepareRenameProvider);
connection.onRenameRequest(renameProvider);
connection.onReferences(referencesProvider);

documents.onDidChangeContent((event: TextDocumentChangeEvent<TextDocument>) => {
	const document = event.document;

	const parser = new CLParser();
	const tokens = parser.parseDocument(document.getText());
	const module = new Module();
	module.parseStatements(tokens);

	CLModules[document.uri] = module;
})

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
// documents.onDidChangeContent(change => {
// 	validateTextDocument(change.document);
// });

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
