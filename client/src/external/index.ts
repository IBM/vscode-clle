import { Extension, extensions } from 'vscode';
import Handler from './handlers/handler';
import vscodeIbmi from './handlers/vscodeIbmi';

const handlerIds = [`halcyontechltd.code-for-ibmi`];
function getHandlerType(id: string): Handler|undefined {
	switch (id) {
		case `halcyontechltd.code-for-ibmi`:
			return new vscodeIbmi(`halcyontechltd.code-for-ibmi`);
	}
	return;
}

export let currentHandler: Handler|undefined;
export async function getHandler(): Promise<Handler|undefined> {
	if (currentHandler) return currentHandler;

	for (const id of handlerIds) {
		const handler = getHandlerType(id);
		try {
			const valid = await handler.initialise();
			if (valid) {
				currentHandler = handler;
				return handler;
			}
		} catch (e) {
			console.log(e);
		}
	}

	return;
}