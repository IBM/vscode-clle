import { Module } from 'language';
import { getCLDefinition } from './instance';
import { CommandDoc, getPrettyDocs } from './spec';

export const CLModules: {[uri: string]: Module} = {}

export const CLCommands: {[qualifiedObject: string]: any} = {};

export async function getCLspec(object: string, library = '*LIBL'): Promise<CommandDoc|undefined> {
	const validObject = object.toUpperCase();
	const validLibrary = (library || `*LIBL`).toUpperCase();
	const qualifiedPath = `${validObject}/${validLibrary}`;

	// Return from cache if it exists
	if (CLCommands[qualifiedPath]) return CLCommands[qualifiedPath];

	const spec = await getCLDefinition(validObject, validLibrary);
	CLCommands[qualifiedPath] = (spec ? getPrettyDocs(spec) : undefined);

	return CLCommands[qualifiedPath];
}
