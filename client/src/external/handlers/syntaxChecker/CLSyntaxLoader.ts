import * as vscode from 'vscode';
import { CLStatementChecker } from './clChecker';
import { collectCLCmd } from './utils';

let bCLCheckerInstalled = false;
const clleDiagnostics = vscode.languages.createDiagnosticCollection('clle');

export async function loadCLSyntaxChecker(context: vscode.ExtensionContext) {
  console.log('[clChecker] Starting CL Syntax Checker starting...');
  const code4iExt = vscode.extensions.getExtension('halcyontechltd.code-for-ibmi');
  if (!code4iExt) {
    vscode.window.showErrorMessage("Code for IBM i extension is not installed or not found.");
    return;
  }
  const exports = await code4iExt.activate();
  console.log('[clChecker] Code for IBM i extension activated.');

  const { instance } = exports;

  async function setupCLSyntaxChecker() {
    const clSyntaxChecker = new CLStatementChecker();
    console.log('[clChecker] Created new CL Stmt Checker object.');
    bCLCheckerInstalled = await clSyntaxChecker.install();
    registerCLSyntaxChecker(context, clSyntaxChecker);
  }

  // Register if already connected
  if (instance.getConnection && instance.getConnection()) {
    await setupCLSyntaxChecker();
  }

  // Register when a new connection is made
  instance.subscribe(context, 'connected', 'clPrompter', async () => {
    await setupCLSyntaxChecker();
  });
}

function registerCLSyntaxChecker(context: vscode.ExtensionContext, clSyntaxChecker: CLStatementChecker) {
  console.log('[CLChecker] registering...');
  context.subscriptions.push(
    vscode.commands.registerCommand('vscode-clle.CLSyntaxCheck', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const document = editor.document;
      const langId = document.languageId.toLowerCase();
      if (!['cl', 'clle', 'clp', 'cmd', 'bnd'].includes(langId)) return;

      clleDiagnostics.clear();

      const cmdResult = collectCLCmd(editor);
      if (!cmdResult || cmdResult.command.trim() === '') return;
      const results = await clSyntaxChecker.check(cmdResult.command);
      if (!results || results.length === 0) return;

      const diagnostics: vscode.Diagnostic[] = [];
      for (const result of results) {
        const startPos = new vscode.Position(cmdResult.startLine, 0);
        const endLineText = document.lineAt(cmdResult.endLine).text;
        const endPos = new vscode.Position(cmdResult.endLine, endLineText.length);
        const range = new vscode.Range(startPos, endPos);
        const diagnostic = new vscode.Diagnostic(
          range,
          `${result.msgid}: ${result.msgtext}`,
          vscode.DiagnosticSeverity.Error
        );
        diagnostics.push(diagnostic);
      }
      clleDiagnostics.set(document.uri, diagnostics);
    })
  );
  console.log('[CLChecker] is now active...');
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(e => {
      clleDiagnostics.delete(e.document.uri);
    })
  );
}