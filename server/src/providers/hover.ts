import { Hover, HoverParams, MarkupKind } from 'vscode-languageserver';
import { documents } from '../instance';
import { CLModules, getCLDocSpec } from '../data';
import { getCLDocParam } from '../instance';

export default async function hoverProvider(params: HoverParams): Promise<Hover | undefined> {
	const currentPath = params.textDocument.uri;
	const document = documents.get(currentPath);

	if (document) {
		const module = CLModules[currentPath];
		if (module) {
			const offset = document.offsetAt(params.position);
			const statement = module.getStatementByOffset(offset);

			if (statement && offset >= statement.range.start && offset <= statement.range.end) {
				const command = statement.getObject();
				if (command) {
					const commandName = command.name.toUpperCase();
					const commandLibrary = command.library || '*LIBL';

					// Parms in the existing statement
					const currentParms = statement.getParms();

					const currentParm = Object.keys(currentParms).find(parmKey => {
						const block = currentParms[parmKey];
						return (offset >= (block.range.start - parmKey.length) && offset <= block.range.end);
					});

					const viewFullDoc = `\n\n---\n\n[View Full Documentation](command:vscode-clle.viewFullDocumentation?${encodeURI(`["${commandName}"${command.library ? `,"${command.library}"` : ``}]`)})`;

					// --- Fast path: CMD_HELP UDTF (no JVM, per-item SQL call) ---
					// For parameter hover pass the keyword; for command hover pass the command name.
					const udtfHelpId = currentParm ?? (
						(() => {
							const token = statement.getTokenByOffset(offset);
							return (token && token.value && token.value.toUpperCase() === commandName) ? commandName : undefined;
						})()
					);

					if (udtfHelpId) {
						const fastMd = await getCLDocParam(commandName, commandLibrary, udtfHelpId);
						if (fastMd) {
							const value = currentParm
								? `${fastMd}${viewFullDoc}`
								: `**${commandName}**\n\n${fastMd}${viewFullDoc}`;
							return { contents: { kind: MarkupKind.Markdown, value } };
						}
					}

					// --- Fallback: full GENCMDDOC parse ---
					const clDoc = await getCLDocSpec(commandName, command.library);
					if (!clDoc) {
						return;
					}

					if (currentParm) {
						const parameterDoc = clDoc.doc.parameters.details.find(p => p.name === currentParm);
						if (parameterDoc && parameterDoc.description) {
							return {
								contents: {
									kind: MarkupKind.Markdown,
									value: `${parameterDoc.description}${viewFullDoc}`
								}
							};
						}
					} else {
						const token = statement.getTokenByOffset(offset);
						if (token && token.value && token.value.toUpperCase() === commandName) {
							if (clDoc.doc.command.description) {
								return {
									contents: {
										kind: MarkupKind.Markdown,
										value: `**${clDoc.doc.command.name}**\n\n${clDoc.doc.command.description}${viewFullDoc}`
									}
								};
							}
						}
					}
				}
			}
		}
	}
}
