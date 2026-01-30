import { Selection, TextDocument, Range, EndOfLine } from 'vscode';

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