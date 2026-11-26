import { getInstance } from './api/ibmi';
import { resolveCommand } from './utils';

export default class GenCmdXml {
	static async getCLDefinition(object: string, library = `*LIBL`): Promise<any | undefined> {
		const instance = getInstance();
		const connection = instance?.getConnection();

		if (connection) {
			if (library === `*LIBL`) {
				const resolvedLibrary = await resolveCommand(object);
				if (resolvedLibrary) {
					library = resolvedLibrary;
				} else {
					throw new Error(`${object} command not found on library list`)
				}
			}

			const result = await connection.getCmdXml(`/${library}.LIB/${object}.CMD`);
			if (result.success) {
				return result.xml;
			}
		}
	}
}