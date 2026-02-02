import { DataType, DefinitionType } from 'language';

export interface CLDoc {
	command: {
		name: string;
		description: string
	}
	parameters: {
		overview: string;
		details: {
			name: string;
			description: string;
		}[]
	};
	examples: string;
	errorMessages: string;
}

export interface CommandDoc {
	commandInfo: CommandInfo;
	parms: Parameter[];
}

interface CommandInfo {
	ccsid: number;
	library: string;
	name: string;
	execBatch: boolean;
	prompt: string;
}

interface Parameter {
	keyword: string;
	prompt: string;
	choice: string;
	type: string;
	position: number;
	specialValues: string[],
	required: boolean;
};

export function getPrettyDocs(docs: any): CommandDoc {
	const commandInfoUgly = docs.QcdCLCmd.Cmd[0][`$`];

	const commandInfo: CommandInfo = {
		ccsid: Number(commandInfoUgly.CCSID),
		library: commandInfoUgly.CmdLib,
		name: commandInfoUgly.CmdName,
		execBatch: commandInfoUgly.ExecBatch === `YES`,
		prompt: commandInfoUgly.Prompt
	};

	const paramaters = docs.QcdCLCmd.Cmd[0].Parm;
	const parms: Parameter[] =
		paramaters ?
			paramaters.map((parm: any) => {
				const info = parm[`$`];
				const qual = parm.Qual;
				const spcVal = parm.SpcVal;

				let specialValues = [];

				if (spcVal && spcVal.length > 0) {
					const opts = spcVal[0].Value;

					specialValues = opts.map((value: any) => value[`$`].Val);
				}

				return {
					keyword: info.Kwd,
					prompt: info.Prompt,
					choice: info.Choice,
					type: info.Type,
					position: Number(info.PosNbr),
					specialValues,
					required : Number(parm?.$?.Min) >= 1 ? true : false
				}
			}) : [];

	return {
		commandInfo,
		parms
	}
}

export namespace Files {

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

	interface typeMap {
		[type: string]: DataType;
	}

	const mappedTypes: typeMap = {
		'A': DataType.Character,
		'I': DataType.Integer,
		'N': DataType.Logical,
		'P': DataType.Packed,
		'S': DataType.Packed, // Is zoned in the database
		'U': DataType.UInteger,
	};
	const supportedTypes = Object.keys(mappedTypes);

	export interface ColumnDefinition {
		name: string;
		dataType: DataType;
		length?: number;
		decimals?: number;
	};

	export function getVariables(columns: ColumnDescription[], openId?: string): ColumnDefinition[] {
		return columns
			.filter(column => supportedTypes.includes(column.WHFLDT))
			.map(column => {
				const definition: ColumnDefinition = {
					name: `&` + (openId ? `${openId}_${column.WHFLDE}` : column.WHFLDE),
					dataType: mappedTypes[column.WHFLDT] || DataType.Unknown
				};

				if ([DataType.Character, DataType.Logical].includes(definition.dataType)) {
					definition.length = column.WHFLDB;
				} else {
					definition.length = column.WHFLDD;
					if (column.WHFLDP > 0)
						definition.decimals = column.WHFLDP;
				}

				return definition;
			});
	}
}