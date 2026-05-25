import * as vscode from 'vscode';
import { generateSplFromPrompt } from './agent/generate';
import { loadForgeConfig } from './config/env';
import { SPLForgePanel } from './panels/assistant';
import { executeSplSearch } from './splunk/execute';

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
        const execution = await executeSplSearch(result.spl, config);

        outputChannel.appendLine(`[provider] ${result.providerUsed}`);
        outputChannel.appendLine(`[raw] ${result.rawText}`);
        outputChannel.appendLine(`[spl] ${result.spl}`);
        outputChannel.appendLine(`[splunk:${execution.mode}] ${execution.status} ${execution.rowCount} row(s) in ${execution.elapsedMs}ms`);
        for (const message of execution.messages) {
          outputChannel.appendLine(`[splunk-message] ${message}`);
        }
        outputChannel.show(true);

        return {
          execution,
          llmModel: config.llmModel,
          planSummary: result.planSummary,
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
