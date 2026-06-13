import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { runForgePrompt } from './agent/workflow';
import { buildSplunkAppPackage, type SplunkAppPackage } from './artifacts/package';
import { loadForgeConfig } from './config/env';
import { SPLForgePanel } from './panels/assistant';
import { publishSplunkAppPackage } from './splunk/publish';

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('SPL Forge');
  const readConfig = () => loadForgeConfig({ extensionRootPath: context.extensionUri.fsPath });

  const disposable = vscode.commands.registerCommand('spl-forge.openPanel', () => {
    SPLForgePanel.createOrShow({
      extensionUri: context.extensionUri,
      onExportApp: async (appPackage) => {
        const result = writeSplunkAppPackage(appPackage, context.extensionUri.fsPath);
        outputChannel.appendLine(`[export-app] ${result.root}`);
        outputChannel.appendLine(`[export-app] ${result.fileCount} file(s)`);
        outputChannel.show(true);
        return result;
      },
      onPublishApp: async (appPackage) => {
        const result = await publishSplunkAppPackage(readConfig(), appPackage);
        outputChannel.appendLine(`[publish] ${result.published.join(', ')}`);
        outputChannel.appendLine(`[reload] ${result.reloaded.join(', ') || 'none'}`);
        if (result.dashboardUrl) {
          outputChannel.appendLine(`[publish] ${result.dashboardUrl}`);
        }
        outputChannel.show(true);
        return result;
      },
      onSubmitPrompt: async (prompt) => {
        const config = readConfig();

        outputChannel.appendLine(`[prompt] ${prompt}`);

        const result = await runForgePrompt(prompt, config);
        const execution = result.execution;

        outputChannel.appendLine(`[provider] ${result.providerUsed}`);
        outputChannel.appendLine(`[raw] ${result.rawText}`);
        if (result.dashboard) {
          outputChannel.appendLine(`[dashboard] ${result.dashboard.title} (${result.dashboard.visualizationType})`);
        }
        if (result.alert) {
          outputChannel.appendLine(`[alert] ${result.alert.title} (${result.alert.condition})`);
        }
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
          alert: result.alert,
          appPackage: buildSplunkAppPackage({ result }),
          dashboard: result.dashboard,
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

function writeSplunkAppPackage(appPackage: SplunkAppPackage, extensionRootPath: string) {
  const root = path.join(extensionRootPath, 'exports', appPackage.appId);

  fs.rmSync(root, { force: true, recursive: true });

  for (const [relativePath, content] of Object.entries(appPackage.files)) {
    const filePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${content}\n`, 'utf8');
  }

  return {
    fileCount: Object.keys(appPackage.files).length,
    root,
  };
}
