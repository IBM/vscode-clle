import { Selection, TextDocument, Range, EndOfLine } from 'vscode';

export type CommandDetails = { content: string, range?: { start: number, end: number } };

export function getCommandString(selection: Selection, document: TextDocument): CommandDetails {
  if (selection.isEmpty) {
    let line = selection.start.line;

    // First let's find out if this command belong to another command
    while ((line - 1) >= 0 && document.lineAt(line - 1).text.trim().endsWith(`+`) && line-- > 0);

    // Then fetch all the lines
    const startLine = line;
    let content = [document.lineAt(line).text.trim()];

    // Then we fetch the next continuation lines
    while (content[content.length - 1].endsWith(`+`)) {
      line += 1;
      content.push(document.lineAt(line).text.trim());
    }

    return {
      content: removePlusJoins(content).join(` `),
      range: {
        start: startLine,
        end: line
      }
    };
  } else {
    const lines = document.getText(new Range(selection.start, selection.end)).split(document.eol === EndOfLine.CRLF ? `\r\n` : `\n`);
    return {
      content: removePlusJoins(lines).join(` `)
    };
  }
}

function removePlusJoins(lines: string[]) {
  for (let i = 0; i < lines.length; i++) {
    lines[i] = lines[i].trim();
    if (lines[i].endsWith(`+`)) lines[i] = lines[i].substring(0, lines[i].length - 1);
  }

  return lines;
}