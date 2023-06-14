
import Handler from './handlers/handler';
import Merlin from './handlers/merlin';
import vscodeIbmi from './handlers/vscodeIbmi';

const handlerIds = [Merlin.extensionId, vscodeIbmi.extensionId];
function getHandlerType(id: string): Handler | undefined {
	switch (id) {
		case vscodeIbmi.extensionId:
			return new vscodeIbmi();
		case Merlin.extensionId:
			return new Merlin();
	}
	return;
}

export let currentHandler: Handler | undefined;
export async function getHandler(): Promise<Handler | undefined> {
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