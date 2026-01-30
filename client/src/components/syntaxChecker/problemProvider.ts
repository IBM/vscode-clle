
import { commands, Diagnostic, DiagnosticSeverity, EndOfLine, ExtensionContext, languages, Position, ProgressLocation, Range, Selection, TextDocument, TextDocumentContentChangeEvent, Uri, window, workspace } from 'vscode';
import Configuration from '../../configuration';
import { CLSyntaxChecker, SupportedLanguageId } from './checker';
import { CommandDetails, getCommandString } from '../../utils';
import { getInstance } from '../../api/ibmi';
import * as path from "path";

export namespace ProblemProvider {
  const SUPPORTED_LANGUAGE_IDS: SupportedLanguageId[] = ['cl', 'bnd', 'cmd'];

  let currentTimeout: NodeJS.Timeout;
  let currentChangedLines: number[] = [];
  let clleDiagnosticCollection = languages.createDiagnosticCollection(`clle`);

  export function registerProblemProvider(context: ExtensionContext) {
    context.subscriptions.push(
      clleDiagnosticCollection,

      commands.registerCommand(`vscode-clle.syntax.checkDocument`, async (uri?: Uri) => {
        const document = uri ? await workspace.openTextDocument(uri) : window.activeTextEditor?.document;

        if (document) {
          await validateCLDocument(document);
        }
      }),

      workspace.onDidCloseTextDocument(e => {
        // Only clear errors from unsaved files.
        if (e.isUntitled) {
          clleDiagnosticCollection.delete(e.uri);
        }
      }),

      workspace.onDidOpenTextDocument(e => {
        const isSupportedLanguage = SUPPORTED_LANGUAGE_IDS.includes(e.languageId as SupportedLanguageId);
        if (isSupportedLanguage) {
          if (checkerAvailable() && !isSafeDocument(e)) {
            const basename = e.fileName ? path.basename(e.fileName) : `Untitled`;
            documentLargeError(basename);
          }

          const checkOnOpen = Configuration.get<boolean>(`syntax.checkOnOpen`) || false
          if (checkOnOpen) {
            validateCLDocument(e);
          }
        }
      }),

      workspace.onDidChangeTextDocument(e => {
        shiftDiagnostics(e.document, e.contentChanges);

        const isSupportedLanguage = SUPPORTED_LANGUAGE_IDS.includes(e.document.languageId as SupportedLanguageId);
        if (isSupportedLanguage) {
          const checkOnChange = Configuration.get<boolean>(`syntax.checkOnEdit`) || false;
          if (checkerAvailable() && checkOnChange && e.contentChanges.length > 0) {
            if (currentTimeout) {
              clearTimeout(currentTimeout);
            }

            for (const change of e.contentChanges) {
              const changeStartLine = change.range.start.line;
              const changeEndLine = change.range.end.line;
              const insertedLineCount = change.text.split('\n').length - 1;
              const deletedLineCount = changeEndLine - changeStartLine;

              // The actual changed end line depends on the content change:
              // 1. Lines added - The change start and end line are the same so adjust based on the number of lines inserted
              // 2. Lines deleted - The change start and end line are different so we can use the change end line
              const actualChangeEndLine = changeStartLine + Math.max(insertedLineCount, deletedLineCount);

              // Add changed lines if not added before
              for (let line = changeStartLine; line <= actualChangeEndLine; line++) {
                if (!currentChangedLines.includes(line)) {
                  currentChangedLines.push(line);
                }
              }

              // Add the line before the start changed line to catch continuation issues
              const lineBeforeStartLine = changeStartLine - 1;
              if (lineBeforeStartLine >= 0 && !currentChangedLines.includes(lineBeforeStartLine)) {
                currentChangedLines.push(lineBeforeStartLine);
              }

              // Add the line after the end changed line to catch continuation issues
              const lineAfterEndLine = actualChangeEndLine + 1;
              if (lineAfterEndLine < e.document.lineCount && !currentChangedLines.includes(lineAfterEndLine)) {
                currentChangedLines.push(lineAfterEndLine);
              }
            }

            const trimmedWhiteSpace = e.contentChanges[0].text.replace(/^[ ]+|[ ]+$/g, '');
            const eol = e.document.eol === EndOfLine.CRLF ? '\r\n' : '\n';
            const isEnterKey = trimmedWhiteSpace === eol;

            if (isEnterKey) {
              // Run syntax checker right away after enter key is pressed
              validateCLDocument(e.document, currentChangedLines);
              currentChangedLines = [];
            } else {
              // Run syntax checker after check interval
              currentTimeout = setTimeout(() => {
                validateCLDocument(e.document, currentChangedLines);
                currentChangedLines = [];
              }, (Configuration.get<number>(`syntax.checkInterval`) || CLSyntaxChecker.CHECK_INTERVAL));
            }
          }
        }
      })
    );

    const instance = getInstance();
    instance!.subscribe(context, 'connected', 'Set CL syntax checker enablement', async () => {
      setCheckerAvailableContext();
    });
    instance!.subscribe(context, 'disconnected', 'Set CL syntax checker enablement', async () => {
      setCheckerAvailableContext(false);
      setCheckerRunningContext(false);
    });
  }

  function shiftDiagnostics(document: TextDocument, changes: readonly TextDocumentContentChangeEvent[]) {
    // Iterate over all changes in this event
    for (const change of changes) {
      const changeStartLine = change.range.start.line;
      const changeEndLine = change.range.end.line;
      const insertedLineCount = change.text.split('\n').length - 1;
      const deletedLineCount = changeEndLine - changeStartLine;

      // Calculate net line shift
      const netLineShift = insertedLineCount - deletedLineCount;

      if (netLineShift === 0) {
        // Nothing to adjust
        return;
      }

      // Update diagnostics ranges for this document
      const currentDiagnostics = clleDiagnosticCollection.get(document.uri) || [];
      const updatedDiagnostics = currentDiagnostics.map(diag => {
        const startLine = diag.range.start.line;
        const endLine = diag.range.end.line;

        if (startLine > changeEndLine) {
          // Diagnostics below the change are impacted so shift diagnostic lines
          const newStart = startLine + netLineShift;
          const newEnd = endLine + netLineShift;

          return new Diagnostic(
            new Range(newStart, diag.range.start.character, newEnd, diag.range.end.character),
            diag.message,
            diag.severity
          );
        } else if (startLine < changeStartLine) {
          // Diagnostics above the change stay the same
          // Diagnostics within the change are removed
          return diag;
        }
      });

      // Update the diagnostic collection
      clleDiagnosticCollection.set(document.uri, updatedDiagnostics);
    };
  }

  async function validateCLDocument(document: TextDocument, specificLines?: number[]) {
    const checker = CLSyntaxChecker.get();
    if (checker) {
      const basename = document.fileName ? path.basename(document.fileName) : `Untitled`;
      if (isSafeDocument(document)) {
        setCheckerRunningContext(true);

        let commandsToCheck: CommandDetails[] = [];

        if (specificLines !== undefined && specificLines.length > 0) {
          // Remove specific lines outside the documents complete range
          specificLines = specificLines.filter(line => line >= 0 && line < document.lineCount);

          // Get the commands at the specific lines
          for (const line of specificLines) {
            const statementSelection = new Selection(new Position(line, 0), new Position(line, 0));
            commandsToCheck.push(getCommandString(statementSelection, document));
          }
        } else {
          // Get all statements in the document
          for (let line = 0; line < document.lineCount; line++) {
            const statementSelection = new Selection(new Position(line, 0), new Position(line, 0));
            commandsToCheck.push(getCommandString(statementSelection, document));
          }
        }

        // Remove duplicate commands to check
        commandsToCheck = commandsToCheck.filter((command, index, self) =>
          index === self.findIndex((c) => c.content === command.content && c.range.start === command.range.start && c.range.end === command.range.end)
        );

        // Get any existing diagnostics for this document
        const diagnostics: Diagnostic[] = specificLines && specificLines.length > 0 ? languages.getDiagnostics(document.uri) as Diagnostic[] : [];
        for (let i = diagnostics.length - 1; i >= 0; i--) {
          const diag = diagnostics[i];

          // Remove diagnostics outside the documents complete range
          if (diag.range.end.line >= document.lineCount || diag.range.start.line < 0) {
            diagnostics.splice(i, 1);
            continue;
          }

          // Remove diagnostics that overlap with the command ranges
          for (const commandToCheck of commandsToCheck) {
            const diagStart = diag.range.start.line;
            const diagEnd = diag.range.end.line;
            const cmdStart = commandToCheck.range.start;
            const cmdEnd = commandToCheck.range.end;
            
            // Check if diagnostic overlaps with command range
            if (diagStart <= cmdEnd && diagEnd >= cmdStart) {
              diagnostics.splice(i, 1);
              break;
            }
          }
        }

        // Remove commands to check which are empty
        commandsToCheck = commandsToCheck.filter(command => command.content !== '');

        await window.withProgress({ location: ProgressLocation.Window, title: `$(sync-spin) Checking CL Syntax` }, async (progress) => {
          for (const [index, command] of commandsToCheck.entries()) {
            try {
              progress.report({ message: `(${index}/${commandsToCheck.length})` });

              // Handle special case in TOBi where a prefix of ! can be used in CL pseudo-source to ignore errors for a command
              // https://ibm.github.io/ibmi-tobi/#/welcome/features?id=support-cl-pseudo-source
              const languageId = document.languageId as SupportedLanguageId;
              if (languageId === `cl` && command.content.startsWith(`!`)) {
                command.content = command.content.slice(1);
              }

              // Run syntax checker and add new diagnostics
              const results = await checker.check(command.content, languageId);
              if (results) {
                for (const result of results) {
                  const startLine = command.range.start;
                  const startCharacter = document.lineAt(startLine).firstNonWhitespaceCharacterIndex;
                  const endLine = command.range.end;
                  const endCharacter = document.lineAt(endLine).text.length;
                  const range = new Range(startLine, startCharacter, endLine, endCharacter);
                  const diagnostic = new Diagnostic(
                    range,
                    `${result.msgid}: ${result.msgtext}`,
                    DiagnosticSeverity.Error
                  );
                  diagnostics.push(diagnostic);
                }
              }
            } catch (error) {
              console.log(`${basename}: Failed to run CL syntax checker - ${error}`);
            }
          }

          clleDiagnosticCollection.set(document.uri, diagnostics);
        });
      } else {
        documentLargeError(basename);
      }

      setCheckerRunningContext(false);
    }
  }

  function isSafeDocument(doc: TextDocument): boolean {
    const isSupportedLanguage = SUPPORTED_LANGUAGE_IDS.includes(doc.languageId as SupportedLanguageId);
    const isBelowMaxLength = doc.lineCount < CLSyntaxChecker.MAX_DOCUMENT_LENGTH;
    return isSupportedLanguage && isBelowMaxLength;
  }

  function checkerAvailable() {
    return CLSyntaxChecker.get() !== undefined;
  }

  function setCheckerAvailableContext(additionalState = true) {
    const available = checkerAvailable() && additionalState;
    commands.executeCommand(`setContext`, `vscode-clle.syntax.checkerAvailable`, available);
  }

  function setCheckerRunningContext(isRunning: boolean) {
    commands.executeCommand(`setContext`, `vscode-clle.syntax.checkerRunning`, isRunning);
  }

  function documentLargeError(basename: string) {
    window.showWarningMessage(`${basename}: the CL syntax checker is disabled for this document because it is too large.`);
  }
}