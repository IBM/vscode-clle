
import { commands, Diagnostic, DiagnosticSeverity, ExtensionContext, languages, Position, ProgressLocation, Range, Selection, TextDocument, Uri, window, workspace } from 'vscode';
import Configuration from '../../../configuration';
import { CLSyntaxChecker } from './checker';
import path = require('path');
import { CommandDetails, getCommandString } from '../../../utils';
import { getInstance } from '../../api/ibmi';

export namespace ProblemProvider {
  let currentTimeout: NodeJS.Timeout;
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
        const isCL = e.languageId === `cl`;
        if (isCL) {
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
        const isCL = e.document.languageId === `cl`;
        if (isCL) {
          const checkOnChange = Configuration.get<boolean>(`syntax.checkOnEdit`) || false;
          if (checkerAvailable() && checkOnChange && e.contentChanges.length > 0) {
            if (currentTimeout) {
              clearTimeout(currentTimeout);
            }

            currentTimeout = setTimeout(() => {
              validateCLDocument(e.document, e.contentChanges[0].range.start.line);
            }, (Configuration.get<number>(`syntax.checkInterval`) || 1500));
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

  async function validateCLDocument(document: TextDocument, specificLine?: number) {
    const checker = CLSyntaxChecker.get();
    if (checker) {
      const basename = document.fileName ? path.basename(document.fileName) : `Untitled`;
      if (isSafeDocument(document)) {
        setCheckerRunningContext(true);

        const languageId = document.languageId.toLowerCase();
        if (['cl', 'clle', 'clp', 'cmd', 'bnd'].includes(languageId)) {
          const modules: any = await commands.executeCommand(`vscode-clle.server.getCache`, document.uri);
          if (modules) {
            const commandsToCheck: CommandDetails[] = [];

            if (specificLine !== undefined) {
              // Get the command at the specific line
              const statementSelection = new Selection(new Position(specificLine, 0), new Position(specificLine, 0));
              commandsToCheck.push(getCommandString(statementSelection, document));
            } else {
              // Get all statements in the document
              for (const statement of modules.statements) {
                const statementSelection = new Selection(document.positionAt(statement.range.start), document.positionAt(statement.range.start));
                commandsToCheck.push(getCommandString(statementSelection, document));
              }
            }

            // Get any existing diagnostics for this document and remove any that are within the command ranges
            const diagnostics: Diagnostic[] = specificLine ? languages.getDiagnostics(document.uri) as Diagnostic[] : [];
            for (let i = diagnostics.length - 1; i >= 0; i--) {
              const diag = diagnostics[i];

              for (const commandToCheck of commandsToCheck) {
                if (diag.range.start.line >= commandToCheck.range.start && diag.range.end.line <= commandToCheck.range.end) {
                  diagnostics.splice(i, 1);
                }
              }
            }

            await window.withProgress({ location: ProgressLocation.Window, title: `$(sync-spin) Checking CL Syntax` }, async (progress) => {
              for (const [index, command] of commandsToCheck.entries()) {
                try {
                  progress.report({ message: `(${index}/${commandsToCheck.length})` });

                  if (command.content !== '') {
                    // Run syntax checker and add any new diagnostics
                    const results = await checker.check(command.content);
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
                  }
                } catch (error) {
                  console.log(`${basename}: Failed to run CL syntax checker - ${error}`);
                }
              }

              clleDiagnosticCollection.set(document.uri, diagnostics);
            });
          } else {
            window.showWarningMessage(`${basename}: Failed to get cache from server`);
          }
        }
      } else {
        documentLargeError(basename);
      }

      setCheckerRunningContext(false);
    }
  }

  function isSafeDocument(doc: TextDocument): boolean {
    return doc.languageId === `cl` && doc.lineCount < CLSyntaxChecker.MAX_DOCUMENT_LENGTH;
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