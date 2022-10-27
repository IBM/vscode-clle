
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
	specialValues: string[]
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
	const parms: Parameter[] = paramaters.map((parm: any) => {
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
			specialValues
		}
	});

	return {
		commandInfo,
		parms
	}
}