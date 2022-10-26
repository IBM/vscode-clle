import { Module } from 'language';
import { getCLDefinition } from './instance';

export const CLModules: {[uri: string]: Module} = {}

export const CLCommands: {[qualifiedObject: string]: any} = {};

export async function getCLspec(object: string, library = '*LIBL') {
	const validObject = object.toUpperCase();
	const validLibrary = (library || `*LIBL`).toUpperCase();
	const qualifiedPath = `${validObject}/${validLibrary}`;

	// Return from cache if it exists
	if (CLCommands[qualifiedPath]) return CLCommands[qualifiedPath];

	CLCommands[qualifiedPath] = await getCLDefinition(validObject, validLibrary);

	return CLCommands[qualifiedPath];
}