import { Selection, TextDocument, Range, EndOfLine } from 'vscode';
import { getInstance } from './api/ibmi';

export type CommandDetails = { content: string, range?: { start: number, end: number } };

export function getCommandString(selection: Selection, document: TextDocument): CommandDetails {
  if (selection.isEmpty) {
    let line = selection.start.line;

    // Find the beginning of the command by moving upwards
    // while the previous line ends with a continuation character
    while (line > 0) {
      const previousLine = document.lineAt(line - 1).text.trim();
      if (previousLine.endsWith(`+`)) {
        line--;
      } else {
        break;
      }
    }

    const startLine = line;
    const content: string[] = [];

    // Add the first line of content
    const firstLineText = document.lineAt(line).text.trim();
    content.push(firstLineText);

    // Add continuation lines by moving downwards
    // while the last line ends with + and we haven't reached the end of the document
    while (line < document.lineCount - 1) {
      // Stop if the last line doesn't end with +
      const lastLineText = content[content.length - 1];
      if (!lastLineText.endsWith(`+`)) {
        break;
      }


      // Go to next line and add line if not a closing comment
      line++;
      const nextLineText = document.lineAt(line).text.trim();
      content.push(nextLineText);
    }

    return {
      content: removePlusJoins(content).join(` `),
      range: {
        start: startLine,
        end: line
      }
    };
  } else {
    const content = document.getText(new Range(selection.start, selection.end)).split(document.eol === EndOfLine.CRLF ? `\r\n` : `\n`);
    return {
      content: removePlusJoins(content).join(` `)
    };
  }
}

function removePlusJoins(lines: string[]) {
  for (let i = 0; i < lines.length; i++) {
    lines[i] = lines[i].trim();
    if (lines[i].endsWith(`+`)) {
      lines[i] = lines[i].substring(0, lines[i].length - 1);
    }
  }

  return lines;
}

/**
 * Returns DSPFFD outfile rows
 */
export async function getFileDefinition(objectName: string, library = `*LIBL`): Promise<any | undefined> {
	const instance = getInstance();
	const connection = instance.getConnection();
	if (connection) {
		const content = connection.getContent();
		const config = connection.getConfig();

		const tempLib = config.tempLibrary;
		const dateStr = Date.now().toString().substr(-6);
		const randomFile = `R${objectName.substring(0, 3)}${dateStr}`.substring(0, 10);
		const fullPath = `${tempLib}/${randomFile}`;

		const outfileRes = await connection.runCommand({
			command: `DSPFFD FILE(${library}/${objectName}) OUTPUT(*OUTFILE) OUTFILE(${fullPath})`,
			environment: `ile`
		});
		console.log(outfileRes);
		const resultCode = outfileRes.code || 0;

		if (resultCode === 0) {
			const data: object[] = await content.getTable(config.tempLibrary, randomFile, randomFile, true);
			console.log(`Temp OUTFILE read. ${data.length} rows.`);
			return data;
		}
	}
}