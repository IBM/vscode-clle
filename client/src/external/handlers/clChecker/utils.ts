

import * as vscode from 'vscode';

/**
 * Extracts a full CL (Command Language) command from a list of lines, starting from a given line index.
 * Handles line continuations indicated by trailing `+` or `-` characters, and ignores trailing comments.
 *
 * The function scans upwards to find the start of the command (handling continuations),
 * then concatenates all relevant lines, removing continuation characters and comments as needed.
 * For `+` continuations, leading whitespace on the next line is trimmed; for `-`, the next line is appended as-is.
 *
 *           const editor = vscode.window.activeTextEditor;
 *           if (editor) {
 *            const doc = editor.document;
 *            const currentLine = editor.selection.active.line;
 *            const cmdResult = extractFullCLCmd(doc, currentLine);
 *           }
 * @param doc - The active text editor's document
 * @param currentLine - The index of the line where the command extraction should start.
 * @returns An object containing:
 *   - `command`: The extracted full command as a single string.
 *   - `startLine`: The index of the first line of the command.
 *   - `endLine`: The index of the last line of the command.
 */

export function collectCLCmd(
  editor: vscode.TextEditor
): { command: string; startLine: number; endLine: number } {

    const doc = editor.document;
    const currentLine = editor.selection.active.line;

  let startLine = currentLine;
  let endLine = currentLine;

  // Scan backward for start of command
  while (startLine > 0) {
    const prevLineText = doc.lineAt(startLine - 1).text;
    const codePart = prevLineText.replace(/\/\*.*\*\//g, '').trimEnd();
    if (codePart.endsWith('+') || codePart.endsWith('-')) {
      startLine--;
    } else {
      break;
    }
  }

  let command = '';
  let lineIndex = startLine;
  const totalLines = doc.lineCount;

  while (lineIndex < totalLines) {
    let line = doc.lineAt(lineIndex).text;
    let codePart = line;
    const commentIdx = line.indexOf('/*');
    if (commentIdx !== -1) {
      codePart = line.substring(0, commentIdx);
    }
    codePart = codePart.replace(/[ \t]+$/, '');

    let contChar = '';
    let lineContent = codePart;
    if (codePart.length > 0 && (codePart[codePart.length - 1] === '+' || codePart[codePart.length - 1] === '-')) {
      contChar = codePart[codePart.length - 1];
      lineContent = codePart.slice(0, -1);
    }

    if (contChar) {
      command += lineContent;
      endLine = lineIndex;
      // Prepare to concatenate the next line
      if (lineIndex + 1 >= totalLines) break;
      let nextLine = doc.lineAt(lineIndex + 1).text;
      let nextContent = nextLine;
      const nextCommentIdx = nextLine.indexOf('/*');
      if (nextCommentIdx !== -1) {
        nextContent = nextLine.substring(0, nextCommentIdx);
      }
      nextContent = nextContent.replace(/[ \t]+$/, '');
      if (nextContent.length > 0 && (nextContent[nextContent.length - 1] === '+' || nextContent[nextContent.length - 1] === '-')) {
        nextContent = nextContent.slice(0, -1);
      }
      if (contChar === '+') {
        let firstNonBlank = nextContent.search(/\S/);
        if (firstNonBlank === -1) firstNonBlank = nextContent.length;
        nextContent = nextContent.slice(firstNonBlank);
      }
      command += nextContent;
      lineIndex += 2;
      endLine = lineIndex - 1;
      continue;
    } else {
      command += lineContent;
      endLine = lineIndex;
      break;
    }
  }

  command = command.replace(/\s{2,}/g, ' ').trim();

  return { command, startLine, endLine };
}
