import { getInstance } from './api/ibmi';
import { window, ViewColumn } from 'vscode';
import { NodeHtmlMarkdown } from "node-html-markdown";
import { JSDOM } from "jsdom";

export interface CLDoc {
	command: {
		name: string;
		description: string
	}
	parameters: {
		overview: string;
		details: {
			name: string;
			description: string;
		}[]
	};
	examples: string;
	errorMessages: string;
}

export class GenCmdDoc {
	private static cachedClDocs: { [qualifiedObject: string]: { html: string, doc: CLDoc } | undefined } = {};

	public static async openClDoc(object: string, library = '*LIBL'): Promise<boolean> {
		const clDoc = await GenCmdDoc.getCLDoc(object, library);
		if (clDoc) {
			const panel = window.createWebviewPanel(`tab`, `${clDoc.doc.command.name} Documentation`, { viewColumn: ViewColumn.Active }, { enableScripts: true });
			panel.webview.html = clDoc.html;
			panel.reveal();
			return true;
		} else {
			return false;
		}
	}

	public static async getCLDoc(object: string, library = '*LIBL'): Promise<{ html: string, doc: CLDoc } | undefined> {
		const validObject = object.toUpperCase();
		const validLibrary = (library || `*LIBL`).toUpperCase();
		const qualifiedPath = `${validObject}/${validLibrary}`;

		// Return doc from cache if it exists
		if (GenCmdDoc.cachedClDocs[qualifiedPath]) {
			return GenCmdDoc.cachedClDocs[qualifiedPath];
		}

		// Generate doc
		const html = await GenCmdDoc.generateHtml(validObject, validLibrary);
		if (html) {
			const doc = GenCmdDoc.parseHtml(validObject, html);
			if (doc) {
				GenCmdDoc.cachedClDocs[qualifiedPath] = { html, doc };
				return GenCmdDoc.cachedClDocs[qualifiedPath];
			}
		}
	}

	public static async generateHtml(object: string, library: string): Promise<string | undefined> {
		const instance = getInstance();
		const connection = instance.getConnection();

		if (connection) {
			const content = connection.getContent();
			const config = connection.getConfig();

			const cmd = `${library}/${object}`;
			const toStmf = `${library.replace('*', '')}_${object}`;
			const toDir = config.tempDir;
			const generateResult = await connection.runCommand({
				command: `GENCMDDOC CMD(${cmd}) GENOPT(*HTML *SHOWCHOICEPGMVAL) REPLACE(*YES) TOSTMF('${toStmf}') TODIR('${toDir}')`
			});

			if (generateResult.code === 0) {
				const html = (await content.downloadStreamfileRaw(`${toDir}/${toStmf}`)).toString();
				return html;
			}
		}
	}

	public static parseHtml(command: string, html: string): CLDoc | undefined {
		const dom = new JSDOM(html);
		const doc = dom.window.document;
		// Override default (https://github.com/crosstype/node-html-markdown/blob/master/src/config.ts#L53C17-L53C45) to avoid escaping asterisks
		const htmlToMd = new NodeHtmlMarkdown({ globalEscape: [/[\\`_~\[\]]/gm, '\\$&'] });

		// Get command name
		const h2 = doc.querySelector(`h2`);
		const commandName = h2?.textContent;
		if (!commandName) {
			return;
		}

		// Get command description
		const tdInfo = doc.querySelector('td[valign="top"][align="left"]');
		const tdHtml = tdInfo?.innerHTML ?? ``;
		const commandDiv = doc.querySelector(`div > a[name="${command}"]`)?.parentElement;
		const commandDivHtml = commandDiv?.innerHTML ?? ``;
		const commandDescription = htmlToMd.translate(`${tdHtml}\n\n${commandDivHtml}`);

		// Get parameter overview
		const tableDiv = doc.querySelector(`div > h3 > a[name="${command}.PARAMETERS.TABLE"]`)?.parentElement?.parentElement;
		const tableH3 = tableDiv?.querySelector(`h3`);
		tableH3?.remove();
		const tableTopOfPage = tableDiv?.querySelector(`table[width="100%"]`);
		tableTopOfPage?.remove();
		const tableDivHtml = tableDiv?.innerHTML ?? ``;
		const parametersOverview = htmlToMd.translate(tableDivHtml);

		// Get parameter details
		const parameterDetails: CLDoc['parameters']['details'] = [];
		const trInfos = tableDiv?.querySelectorAll(`tr`);
		const rows = trInfos ? Array.from(trInfos).slice(1) : [];
		rows.forEach(row => {
			const cells = row?.querySelectorAll(`td`);
			if (cells) {
				const parameterName = cells[0]?.textContent?.trim() ?? ``;
				if (parameterName) {
					parameterDetails.push({
						name: parameterName,
						description: ``
					});
				}
			}
		});

		// Get parameter detail descriptions
		parameterDetails.forEach(param => {
			const parameterDiv = doc.querySelector(`div > a[name="${command}.${param.name}"]`)?.parentElement;
			const parameterDivHtml = parameterDiv?.innerHTML ?? ``;
			param.description = htmlToMd.translate(parameterDivHtml);
		});

		// Get examples
		const examplesDiv = doc.querySelector(`div > h3 > a[name="${command}.COMMAND.EXAMPLES"]`)?.parentElement?.parentElement;
		const examplesH3 = examplesDiv?.querySelector(`h3`);
		examplesH3?.remove();
		const examplesDivHtml = examplesDiv?.innerHTML ?? ``;
		const examples = htmlToMd.translate(examplesDivHtml);

		// Get error messages
		const errorMessageDiv = doc.querySelector(`div > h3 > a[name="${command}.ERROR.MESSAGES"]`)?.parentElement?.parentElement;
		const errorMessageH3 = errorMessageDiv?.querySelector(`h3`);
		errorMessageH3?.remove();
		const errorMessageDivHtml = errorMessageDiv?.innerHTML ?? ``;
		const errorMessages = htmlToMd.translate(errorMessageDivHtml);

		return {
			command: {
				name: commandName,
				description: commandDescription
			},
			parameters: {
				overview: parametersOverview,
				details: parameterDetails
			},
			examples,
			errorMessages
		};
	}
}