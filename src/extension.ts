import * as vscode from 'vscode';
import { generateSplFromPrompt } from './agent/generate';
import { loadForgeConfig } from './config/env';
import { SPLForgePanel } from './panels/assistant';

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('SPL Forge');
  const readConfig = () => loadForgeConfig({ extensionRootPath: context.extensionUri.fsPath });

  const disposable = vscode.commands.registerCommand('spl-forge.openPanel', () => {
    SPLForgePanel.createOrShow({
      extensionUri: context.extensionUri,
      onSubmitPrompt: async (prompt) => {
        const config = readConfig();

        outputChannel.appendLine(`[prompt] ${prompt}`);

        const result = await generateSplFromPrompt({ prompt }, config);

        outputChannel.appendLine(`[provider] ${result.providerUsed}`);
        outputChannel.appendLine(`[raw] ${result.rawText}`);
        outputChannel.appendLine(`[spl] ${result.spl}`);
        outputChannel.show(true);

        return {
          llmModel: config.llmModel,
          providerLabel: result.providerUsed,
          rawText: result.rawText,
          spl: result.spl,
        };
      },
      readConfig,
    });
  });

  context.subscriptions.push(disposable, outputChannel);
}

export function deactivate() {}
