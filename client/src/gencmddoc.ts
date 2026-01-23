import { getInstance } from './api/ibmi';
import { NodeHtmlMarkdown } from "node-html-markdown";
import { JSDOM } from "jsdom";

interface DetailedCommandDoc {
	command: {
		name: string;
		description: string
	}
	parameters: {
		name: string;
		description: string;
	}[];
}

export namespace GenCmdDoc {
	export async function generateHtml(object: string, library: string): Promise<string | undefined> {
		const instance = getInstance();
		const connection = instance.getConnection();
		const content = connection.getContent();

		if (connection) {
			const cmd = `${library}/${object}`;
			const toStmf = `${library.replace('*', '')}_${object}`;
			const generateResult = await connection.runCommand({
				command: `GENCMDDOC CMD(${cmd}) GENOPT(*HTML *SHOWCHOICEPGMVAL) REPLACE(*YES) TOSTMF('${toStmf}') TODIR('/tmp')`,
				noLibList: true
			});

			if (generateResult.code === 0) {
				const html = (await content.downloadStreamfileRaw(`/tmp/${toStmf}`)).toString();
				return html;
			}
		}
	}

	export async function parseHtml(command: string, html: string): Promise<DetailedCommandDoc | undefined> {
		const dom = new JSDOM(html);
		const doc = dom.window.document;

		// Get command name
		const h2 = doc.querySelector(`h2`);
		const commandName = h2?.textContent;
		if (!commandName) {
			return;
		}

		// Get command description
		const tdInfo = doc.querySelector('td[valign="top"][align="left"]');
		const tdHtml = tdInfo?.innerHTML ?? "";
		const div = doc.querySelector(`div > a[name="${command}"]`)?.parentElement;
		const divHtml = div?.innerHTML ?? "";
		const commandDescription = NodeHtmlMarkdown.translate(`${tdHtml}\n\n${divHtml}`);

		// Get parameter names
		const h3 = doc.querySelector(`h3 > a[name="${command}.PARAMETERS.TABLE"]`).parentElement;
		const table = h3.nextElementSibling;
		const parameters: DetailedCommandDoc[`parameters`] = [];
		if (table) {
			const rows = Array.from(table.querySelectorAll("tr")).slice(1);
			rows.forEach(row => {
				const cells = row.querySelectorAll("td");
				const parameterName = cells[0]?.textContent?.trim() ?? "";
				if (parameterName) {
					parameters.push({
						name: parameterName,
						description: ``
					});
				}
			});
		}

		// Get parameter descriptions
		parameters.forEach(param => {
			const div = doc.querySelector(`div > a[name="${command}.${param.name}"]`)?.parentElement;
			const divHtml = div?.innerHTML ?? "";
			param.description = NodeHtmlMarkdown.translate(divHtml);
		});

		return {
			command: {
				name: commandName,
				description: commandDescription
			},
			parameters
		};
	}
}