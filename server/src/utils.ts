import { DataType, DefinitionType, File, Statement, Variable } from 'language';

const typeMap = {
	[DataType.Character]: 'Character',
	[DataType.Integer]: 'Integer',
	[DataType.Label]: 'Label',
	[DataType.Logical]: 'Logical',
	[DataType.Packed]: 'Decimal',
	[DataType.Pointer]: 'Pointer',
	[DataType.Subroutine]: 'Subroutine',
	[DataType.UInteger]: 'Unsigned Integer',
	[DataType.Unknown]: 'Unknown'
};

export function buildDescription(def: Variable|File): string {
	if (def instanceof Variable){
		return varDescription(def)
	}
	return fileDescription(def);
}

export function varDescription(def: Variable): string {
	const varDesc = [];

	if (typeMap[def.dataType]) {
		varDesc.push(typeMap[def.dataType]);

		const parms = def.getParms();

		if (parms['LEN'] && parms['LEN'].block) {
			const lenTokens = parms['LEN'].block;
			const parmVal = lenTokens
				.map(token => token.value)
				.join(`, `);
			varDesc.push(`(${parmVal})`);
		}
	}

	return varDesc.filter(v => v).join(' ');
}

export function fileDescription(def: File): string {
	const openId = def.getOpenID();
	
	return [
		def.file ? [def.file.library, def.file.name].filter(v => v).join(`/`) : undefined,
		openId ? `OPNID(${openId})` : undefined
	].filter(v => v).join(` `)
}