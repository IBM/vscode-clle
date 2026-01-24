import * as path from 'path';
import { ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import { loadBase } from './api/ibmi';
import { initialiseRunner } from './clRunner';
import { CLSyntaxChecker } from './components/syntaxChecker/checker';
import { ProblemProvider } from './components/syntaxChecker/problemProvider';
import { registerCommands } from './commands';
import GenCmdXml from './components/gencmdxml/gencmdxml';
import { GenCmdDoc } from './gencmddoc';

export interface CLLE {
	genCmdDoc: typeof GenCmdDoc
}

let client: LanguageClient;

export function activate(context: ExtensionContext): CLLE {
	loadBase();

	// The server is implemented in node
	const serverModule = context.asAbsolutePath(
		path.join('out', 'server.js')
	);
	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ language: 'cl' }],
		markdown: {
			isTrusted: true
		}
		// synchronize: {
		// 	// Notify the server about file changes to '.clientrc files contained in the workspace
		// 	fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		// }
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'vscode-clle-client',
		'CLLE Language Server',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();

	client.onReady().then(() => {
		client.onRequest("getCLDefinition", async (qualifiedObject: string[]) => {
			const genCmdXml = GenCmdXml.get();
			if (genCmdXml) {
				const definition = await genCmdXml.getCLDefinition(qualifiedObject[0], qualifiedObject[1]);

				return definition;
			}
		});

		client.onRequest("getFileDefinition", async (qualifiedObject: string[]) => {
			const genCmdXml = GenCmdXml.get();
			if (genCmdXml) {
				const definition = await genCmdXml.getFileDefinition(qualifiedObject[0], qualifiedObject[1]);

				return definition;
			}
		});

		client.onRequest("getCLDoc", async (qualifiedObject: string[]) => {
			try {
				const html = await GenCmdDoc.generateHtml(qualifiedObject[0], qualifiedObject[1]);
				if (html) {
					const doc = GenCmdDoc.parseHtml(qualifiedObject[0], html);
					if (doc) {
						return { html, doc };
					}
				}
			} catch (e) {
				console.log(e);
			}
		});
	});

	initialiseRunner(context);
	registerCommands(context, client);
	CLSyntaxChecker.registerComponent(context);
	GenCmdXml.registerComponent(context);
	ProblemProvider.registerProblemProvider(context);

	return {
		genCmdDoc: GenCmdDoc
	}
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
