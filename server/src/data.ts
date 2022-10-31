import { Module } from 'language';
import { getCLDefinition, getFileDefinition } from './instance';
import { Files, CommandDoc, getPrettyDocs } from './spec';

export const CLModules: {[uri: string]: Module} = {}

export const CLCommands: {[qualifiedObject: string]: CommandDoc|undefined} = {};
export const FileDefinitions: {[qualifiedObject: string]: Files.ColumnDefinition[]|undefined} = {};

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

export function getFileSpecCache(object: string, library = '*LIBL'): Files.ColumnDefinition[]|undefined {
	const validObject = object.toUpperCase();
	const validLibrary = (library || `*LIBL`).toUpperCase();
	const qualifiedPath = `${validObject}/${validLibrary}`;

	return FileDefinitions[qualifiedPath];
}

export async function getFileSpec(object: string, library = '*LIBL'): Promise<Files.ColumnDefinition[]|undefined> {
	const validObject = object.toUpperCase();
	const validLibrary = (library || `*LIBL`).toUpperCase();
	const qualifiedPath = `${validObject}/${validLibrary}`;

	// Return from cache if it exists
	if (FileDefinitions[qualifiedPath]) return FileDefinitions[qualifiedPath];

	const spec = await getFileDefinition(validObject, validLibrary);
	FileDefinitions[qualifiedPath] = (spec ? Files.getTypes(spec) : undefined);

	return FileDefinitions[qualifiedPath];
}