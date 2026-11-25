import { getInstance } from './api/ibmi';
import { window, ViewColumn } from 'vscode';
import { NodeHtmlMarkdown } from "node-html-markdown";
import { parse as parseHtmlDoc } from "node-html-parser";
import * as path from "path";

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
		let html = await GenCmdDoc.generateHtml(validObject, validLibrary);
		if (html) {
			// Convert legacy named anchors to modern IDs to support fragment navigation so links work in webviews
			const htmlDoc = parseHtmlDoc(html);
			htmlDoc.querySelectorAll('a[name]').forEach(anchor => {
				const name = anchor.getAttribute('name');

				if (name) {
					anchor.setAttribute('id', name);
				}
			});
			html = htmlDoc.toString();

			const doc = GenCmdDoc.parseHtml(validObject, html);
			if (doc) {
				GenCmdDoc.cachedClDocs[qualifiedPath] = { html, doc };
				return GenCmdDoc.cachedClDocs[qualifiedPath];
			}
		}
	}

	public static async generateHtml(object: string, library: string): Promise<string | undefined> {
		const instance = getInstance();
		const connection = instance?.getConnection();

		if (connection) {
			if (library === `*LIBL`) {
				// Search library list for first library with specified command
				const result = await connection.runSQL(/* sql */`
					SELECT
						C.COMMAND_LIBRARY
					FROM QSYS2.COMMAND_INFO C
					JOIN QSYS2.LIBRARY_LIST_INFO L
						ON L.SYSTEM_SCHEMA_NAME = C.COMMAND_LIBRARY
					WHERE C.COMMAND_NAME = '${object}'
					ORDER BY L.ORDINAL_POSITION
					FETCH FIRST 1 ROW ONLY
				`);
				if (result.length > 0) {
					library = String(result[0].COMMAND_LIBRARY);
				} else {
					throw new Error(`${object} command not found on library list`)
				}
			}

			const result = await connection.getCLDoc(`/${library}.LIB/${object}.CMD`);
			if (result.success) {
				return result.html;
			}
		}
	}

	public static parseHtml(command: string, html: string): CLDoc | undefined {
		const htmlDoc = parseHtmlDoc(html);
		// Override default (https://github.com/crosstype/node-html-markdown/blob/master/src/config.ts#L53C17-L53C45) to avoid escaping asterisks
		const htmlToMd = new NodeHtmlMarkdown({ globalEscape: [/[\\`_~\[\]]/gm, '\\$&'] });

		// Get command name
		const h2 = htmlDoc.querySelector(`h2`);
		const commandName = h2?.textContent;
		if (!commandName) {
			return;
		}

		// Get command description
		const tdInfo = htmlDoc.querySelector('td[valign="top"][align="left"]');
		const tdHtml = tdInfo?.innerHTML ?? ``;
		const commandDiv = htmlDoc.querySelector(`div > a[name="${command}"]`)?.parentNode;
		const commandDivHtml = commandDiv?.innerHTML ?? ``;
		const commandDescription = htmlToMd.translate(`${tdHtml}\n\n${commandDivHtml}`);

		// Get parameter overview
		const tableDiv = htmlDoc.querySelector(`div > h3 > a[name="${command}.PARAMETERS.TABLE"]`)?.parentNode?.parentNode;
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
			const parameterDiv = htmlDoc.querySelector(`div > a[name="${command}.${param.name}"]`)?.parentNode;
			const parameterDivHtml = parameterDiv?.innerHTML ?? ``;
			param.description = htmlToMd.translate(parameterDivHtml);
		});

		// Get examples
		const examplesDiv = htmlDoc.querySelector(`div > h3 > a[name="${command}.COMMAND.EXAMPLES"]`)?.parentNode?.parentNode;
		const examplesH3 = examplesDiv?.querySelector(`h3`);
		examplesH3?.remove();
		const examplesDivHtml = examplesDiv?.innerHTML ?? ``;
		const examples = htmlToMd.translate(examplesDivHtml);

		// Get error messages
		const errorMessageDiv = htmlDoc.querySelector(`div > h3 > a[name="${command}.ERROR.MESSAGES"]`)?.parentNode?.parentNode;
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

	public static clearCLDocCache() {
		GenCmdDoc.cachedClDocs = {};
	}
}