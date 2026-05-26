import * as vscode from 'vscode';
import { runForgePrompt } from './agent/workflow';
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

        const result = await runForgePrompt(prompt, config);
        const execution = result.execution;

        outputChannel.appendLine(`[provider] ${result.providerUsed}`);
        outputChannel.appendLine(`[raw] ${result.rawText}`);
        for (const [index, attempt] of result.attempts.entries()) {
          outputChannel.appendLine(`[attempt:${index + 1}] ${attempt.spl}`);
          outputChannel.appendLine(`[splunk:${attempt.execution.mode}] ${attempt.execution.status} ${attempt.execution.rowCount} row(s) in ${attempt.execution.elapsedMs}ms`);
          if (attempt.repairReason) {
            outputChannel.appendLine(`[repair:${index + 1}] ${attempt.repairReason}`);
          }
          for (const message of attempt.execution.messages) {
            outputChannel.appendLine(`[splunk-message] ${message}`);
          }
        }
        outputChannel.show(true);

        return {
          execution,
          llmModel: config.llmModel,
          planSummary: result.planSummary,
          providerLabel: result.providerUsed,
          rawText: result.rawText,
          repairSummary: result.repairSummary,
          spl: result.spl,
        };
      },
      readConfig,
    });
  });

  context.subscriptions.push(disposable, outputChannel);
}

export function deactivate() {}
