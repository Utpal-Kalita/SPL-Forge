import * as vscode from 'vscode';
import { SPLForgePanel } from './panels/assistant';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('spl-forge.openPanel', () => {
    SPLForgePanel.createOrShow(context.extensionUri);
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
