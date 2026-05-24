import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('spl-forge.openPanel', () => {
    vscode.window.showInformationMessage('SPL Forge panel coming next.');
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}