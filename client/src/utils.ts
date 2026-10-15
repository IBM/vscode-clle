import { Selection, TextDocument, Range, EndOfLine } from 'vscode';
import { getInstance } from './api/ibmi';

export type CommandDetails = { content: string, range?: { start: number, end: number } };

// https://www.ibm.com/docs/en/i/7.6.0?topic=parts-cl-command-continuation
const CL_CONTINUATION = '+'; // The next line's leading blanks are ignored
const CL_CONTINUATION_PRESERVE = '-'; // The next line's leading blanks are preserved

export function getCommandString(selection: Selection, document: TextDocument): CommandDetails {
  if (selection.isEmpty) {
    let line = selection.start.line;

    // Find the beginning of the command by moving upwards
    // while the previous line ends with a continuation character
    while (line > 0) {
      const previousLine = document.lineAt(line - 1).text.trim();
      if (previousLine.endsWith(CL_CONTINUATION) || previousLine.endsWith(CL_CONTINUATION_PRESERVE)) {
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
      if (!lastLineText.endsWith(CL_CONTINUATION) && !lastLineText.endsWith(CL_CONTINUATION_PRESERVE)) {
        break;
      }


      // Go to next line and add line if not a closing comment
      line++;
      const nextLineText = document.lineAt(line).text.trimEnd();
      content.push(nextLineText);
    }

    return {
      content: removePlusJoins(content).join(``),
      range: {
        start: startLine,
        end: line
      }
    };
  } else {
    const content = document.getText(new Range(selection.start, selection.end)).split(document.eol === EndOfLine.CRLF ? `\r\n` : `\n`);
    return {
      content: removePlusJoins(content).join(``)
    };
  }
}

function removePlusJoins(lines: string[]): string[] {
  let preserveNextLineBlanks: boolean = false;

  for (let i = 0; i < lines.length; i++) {
    lines[i] = preserveNextLineBlanks ? lines[i].trimEnd() : lines[i].trim();
    
    const endsWithContinuation = lines[i].endsWith(CL_CONTINUATION);
    const endsWithPreserve = lines[i].endsWith(CL_CONTINUATION_PRESERVE);

    if (endsWithContinuation || endsWithPreserve) {
      lines[i] = lines[i].substring(0, lines[i].length - 1);
      preserveNextLineBlanks = endsWithPreserve;
    }
  }

  return lines;
}

/**
 * Returns DSPFFD outfile rows
 */
export async function getFileDefinition(objectName: string, library = `*LIBL`): Promise<any | undefined> {
  const instance = getInstance();
  const connection = instance?.getConnection();
  if (connection) {
    const content = connection.getContent();
    const config = connection.getConfig();

    const tempLib = 'QTEMP';
    const dateStr = Date.now().toString().substr(-6);
    const randomFile = `R${objectName.substring(0, 3)}${dateStr}`.substring(0, 10);
    const fullPath = `${tempLib}/${randomFile}`;

    const outfileRes = await connection.runCommand({
      command: `QSYS/DSPFFD FILE(${library}/${objectName}) OUTPUT(*OUTFILE) OUTFILE(${fullPath})`,
      environment: `ile`
    });
    console.log(outfileRes);
    const resultCode = outfileRes.code || 0;

    if (resultCode === 0) {
      const data: object[] = await content.getTable(tempLib, randomFile, randomFile, true);
      console.log(`Temp OUTFILE read. ${data.length} rows.`);

      connection.runCommand({
        environment: `ile`,
        command: `QSYS/DLTOBJ OBJ(${fullPath}) OBJTYPE(*FILE)`
      });

      return data;
    }
  }
}