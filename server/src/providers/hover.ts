import { Hover, HoverParams, MarkupKind } from 'vscode-languageserver';
import { documents } from '../instance';
import { CLModules, getCLDocSpec } from '../data';

export default async function hoverProvider(params: HoverParams): Promise<Hover | undefined> {
	const currentPath = params.textDocument.uri;
	const document = documents.get(currentPath);

	if (document) {
		const module = CLModules[currentPath];
		if (module) {
			const offset = document.offsetAt(params.position);
			const statement = module.getStatementByOffset(offset);

			if (statement) {
				const command = statement.getObject();
				if (command) {
					const commandName = command.name.toUpperCase();
					const detailedDoc = await getCLDocSpec(commandName, command.library);
					if (!detailedDoc) {
						return;
					}

					// Parms in the existing statement
					const currentParms = statement.getParms();

					const currentParm = Object.keys(currentParms).find(parmKey => {
						const block = currentParms[parmKey];
						return (offset >= (block.range.start - parmKey.length) && offset <= block.range.end);
					});

					// Check if hovering on a parameter
					if (currentParm) {
						const parameterDoc = detailedDoc.parameters.find(p => p.name === currentParm);
						if (parameterDoc && parameterDoc.description) {
							return {
								contents: {
									kind: MarkupKind.Markdown,
									value: `${parameterDoc.description}\n\n---\n\n[Search on IBM Documentation](https://www.ibm.com/docs/en/search)`
								}
							};
						}
					} else {
						// Check if hovering on a command
						const token = statement.getTokenByOffset(offset);
						if (token && token.value && token.value.toUpperCase() === commandName) {
							if (detailedDoc.command.description) {
								return {
									contents: {
										kind: MarkupKind.Markdown,
										value: `**${detailedDoc.command.name}**\n\n${detailedDoc.command.description}\n\n---\n\n[View Full Documentation](command:vscode-clle.viewFullDocumentation)`
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
