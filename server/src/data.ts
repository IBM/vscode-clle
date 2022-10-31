import { Module } from 'language';
import { getCLDefinition, getFileDefinition } from './instance';
import { CommandDoc, getPrettyDocs } from './spec';

export const CLModules: {[uri: string]: Module} = {}

export const CLCommands: {[qualifiedObject: string]: any} = {};
export const FileDefinitions: {[qualifiedObject: string]: ColumnDescription[]} = {};

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

export async function getFileSpec(object: string, library = '*LIBL'): Promise<ColumnDescription[]|undefined> {
	const validObject = object.toUpperCase();
	const validLibrary = (library || `*LIBL`).toUpperCase();
	const qualifiedPath = `${validObject}/${validLibrary}`;

	// Return from cache if it exists
	if (FileDefinitions[qualifiedPath]) return FileDefinitions[qualifiedPath];

	const spec = await getFileDefinition(validObject, validLibrary);
	if (spec) FileDefinitions[qualifiedPath] = spec;

	return FileDefinitions[qualifiedPath];
}

/**
 * DSPFFD outfile row
 */
 export interface ColumnDescription {
	/** from object */
	WHFILE: string;
	/** from library */
	WHLIB: string;
	/** format name */
	WHNAME: string;
	/** system name */
	WHFLDE: string;
	/** string length */
	WHFLDB: number;
	/** digits */
	WHFLDD: number;
	/** decimals */
	WHFLDP: number;
	/** text */
	WHFTXT: string;
	/** data type */
	WHFLDT: string;
	/** alias name */
	WHALIS: string;
}