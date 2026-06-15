import * as vscode from 'vscode';
import type { AlertArtifact } from '../artifacts/alert';
import type { DashboardArtifact } from '../artifacts/dashboard';
import type { SplunkAppPackage } from '../artifacts/package';
import type { ForgeConfig } from '../config/env';
import type { SplunkSearchResult } from '../splunk/execute';
import type { SplunkPublishResult } from '../splunk/publish';

const panelType = 'splForgeAssistant';
const defaultPrompt = 'Create a failed login dashboard by country and user agent. Alert if failed attempts exceed 100 in 5 minutes.';

type PromptResult = {
  alert?: AlertArtifact;
  appPackage?: SplunkAppPackage;
  dashboard?: DashboardArtifact;
  execution: SplunkSearchResult;
  llmModel: string;
  planSummary: string;
  providerLabel: string;
  rawText: string;
  repairSummary: string;
  spl: string;
};

type PanelDependencies = {
  extensionUri: vscode.Uri;
  onExportApp(appPackage: SplunkAppPackage): Promise<ExportResult>;
  onPublishApp(appPackage: SplunkAppPackage): Promise<SplunkPublishResult>;
  onSubmitPrompt(prompt: string): Promise<PromptResult>;
  readConfig(): ForgeConfig;
};

type ExportResult = {
  fileCount: number;
  root: string;
};

type HistoryItem = {
  alert?: AlertArtifact;
  appPackage?: SplunkAppPackage;
  dashboard?: DashboardArtifact;
  elapsedMs: number;
  execution: SplunkSearchResult;
  planSummary: string;
  prompt: string;
  provider: string;
  rawText: string;
  repairSummary: string;
  rowCount: number;
  spl: string;
  status: SplunkSearchResult['status'];
  timestamp: string;
};

type PanelState = {
  history: HistoryItem[];
  lastAppPackage?: SplunkAppPackage;
  lastExport?: ExportResult;
  lastPublish?: SplunkPublishResult;
  lastPrompt: string;
  lastRawText?: string;
  lastSpl?: string;
  lastProvider?: string;
  lastRepairSummary?: string;
  lastError?: string;
  lastExecution?: SplunkSearchResult;
  lastPlanSummary?: string;
  lastDashboard?: DashboardArtifact;
  lastAlert?: AlertArtifact;
  status: 'error' | 'idle' | 'running' | 'success' | 'warning';
};

export class SPLForgePanel {
  private static currentPanel: SPLForgePanel | undefined;

  private readonly dependencies: PanelDependencies;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly panel: vscode.WebviewPanel;
  private state: PanelState = {
    history: [],
    lastPrompt: defaultPrompt,
    status: 'idle',
  };

  public static createOrShow(dependencies: PanelDependencies) {
    const column = vscode.window.activeTextEditor?.viewColumn;

    if (SPLForgePanel.currentPanel) {
      SPLForgePanel.currentPanel.panel.reveal(column);
      SPLForgePanel.currentPanel.render();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      panelType,
      'SPL Forge',
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      },
    );

    SPLForgePanel.currentPanel = new SPLForgePanel(panel, dependencies);
  }

  private constructor(panel: vscode.WebviewPanel, dependencies: PanelDependencies) {
    this.panel = panel;
    this.dependencies = dependencies;

    this.render();
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.onDidChangeViewState(() => this.render(), null, this.disposables);
    this.panel.webview.onDidReceiveMessage((message) => void this.handleMessage(message), null, this.disposables);
  }

  public dispose() {
    SPLForgePanel.currentPanel = undefined;
    this.panel.dispose();

    while (this.disposables.length > 0) {
      this.disposables.pop()?.dispose();
    }
  }

  private async handleMessage(message: unknown) {
    if (isExportMessage(message)) {
      await this.exportCurrentApp();
      return;
    }

    if (isPublishMessage(message)) {
      await this.publishCurrentApp();
      return;
    }

    if (isHistoryMessage(message)) {
      this.restoreHistoryItem(message.index);
      return;
    }

    if (!isPromptMessage(message)) {
      return;
    }

    const prompt = message.prompt.trim();

    if (!prompt) {
      this.state = {
        ...this.state,
        lastError: 'Prompt is empty.',
        status: 'error',
      };
      this.render();
      return;
    }

    this.state = {
      ...this.state,
      lastError: undefined,
      lastPrompt: prompt,
      status: 'running',
    };
    this.render();

    try {
      const result = await this.dependencies.onSubmitPrompt(prompt);

      this.state = {
        lastAlert: result.alert,
        lastAppPackage: result.appPackage,
        lastDashboard: result.dashboard,
        lastExecution: result.execution,
        lastExport: undefined,
        lastPublish: undefined,
        lastError: undefined,
        history: [
          {
            alert: result.alert,
            appPackage: result.appPackage,
            dashboard: result.dashboard,
            elapsedMs: result.execution.elapsedMs,
            execution: result.execution,
            planSummary: result.planSummary,
            prompt,
            provider: `${result.providerLabel} / ${result.llmModel}`,
            rawText: result.rawText,
            repairSummary: result.repairSummary,
            rowCount: result.execution.rowCount,
            spl: result.spl,
            status: result.execution.status,
            timestamp: new Date().toLocaleTimeString(),
          },
          ...this.state.history,
        ].slice(0, 6),
        lastPlanSummary: result.planSummary,
        lastPrompt: prompt,
        lastProvider: `${result.providerLabel} / ${result.llmModel}`,
        lastRawText: result.rawText,
        lastRepairSummary: result.repairSummary,
        lastSpl: result.spl,
        status: result.execution.status === 'success' ? 'success' : 'warning',
      };
    } catch (error) {
      this.state = {
        ...this.state,
        lastError: error instanceof Error ? error.message : 'Unknown generation failure.',
        status: 'error',
      };
    }

    this.render();
  }

  private async exportCurrentApp() {
    const appPackage = this.state.lastAppPackage;

    if (!appPackage) {
      this.state = {
        ...this.state,
        lastError: 'No packaged app artifact yet. Generate and run SPL first.',
        status: 'error',
      };
      this.render();
      return;
    }

    this.state = {
      ...this.state,
      lastError: undefined,
      status: 'running',
    };
    this.render();

    try {
      const result = await this.dependencies.onExportApp(appPackage);
      this.state = {
        ...this.state,
        lastExport: result,
        status: 'success',
      };
    } catch (error) {
      this.state = {
        ...this.state,
        lastError: error instanceof Error ? error.message : 'Unknown export failure.',
        status: 'error',
      };
    }

    this.render();
  }

  private async publishCurrentApp() {
    const appPackage = this.state.lastAppPackage;

    if (!appPackage) {
      this.state = {
        ...this.state,
        lastError: 'No packaged app artifact yet. Generate and run SPL first.',
        status: 'error',
      };
      this.render();
      return;
    }

    this.state = {
      ...this.state,
      lastError: undefined,
      status: 'running',
    };
    this.render();

    try {
      const result = await this.dependencies.onPublishApp(appPackage);
      this.state = {
        ...this.state,
        lastPublish: result,
        status: 'success',
      };
    } catch (error) {
      this.state = {
        ...this.state,
        lastError: error instanceof Error ? error.message : 'Unknown Splunk publish failure.',
        status: 'error',
      };
    }

    this.render();
  }

  private restoreHistoryItem(index: number) {
    const item = this.state.history[index];

    if (!item) {
      return;
    }

    this.state = {
      ...this.state,
      lastAlert: item.alert,
      lastAppPackage: item.appPackage,
      lastDashboard: item.dashboard,
      lastExecution: item.execution,
      lastExport: undefined,
      lastPublish: undefined,
      lastError: undefined,
      lastPlanSummary: item.planSummary,
      lastPrompt: item.prompt,
      lastProvider: item.provider,
      lastRawText: item.rawText,
      lastRepairSummary: item.repairSummary,
      lastSpl: item.spl,
      status: item.status === 'success' ? 'success' : 'warning',
    };
    this.render();
  }

  private render() {
    const config = this.dependencies.readConfig();

    this.panel.webview.html = getPanelHtml({
      config,
      cspSource: this.panel.webview.cspSource,
      extensionUri: this.dependencies.extensionUri.toString(),
      state: this.state,
    });
  }
}

type PanelHtmlInput = {
  config: ForgeConfig;
  cspSource: string;
  extensionUri: string;
  state: PanelState;
};

export function getPanelHtml(input: PanelHtmlInput) {
  const { config, cspSource, extensionUri, state } = input;
  const statusLabel = getStatusLabel(state.status);
  const canExport = Boolean(state.lastAppPackage) && state.status !== 'running';
  const canPublish = Boolean(state.lastAppPackage) && state.status !== 'running';
  const historyMarkup = formatHistory(state.history);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-splforge'; img-src ${cspSource} https: data:;"
    />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SPL Forge</title>
    <style>
      :root {
        color-scheme: light dark;
        --bg: #0f172a;
        --panel: #111827;
        --panel-2: #182235;
        --surface: #f8fafc;
        --surface-soft: #eef2f7;
        --text: #f8fafc;
        --text-light: #0f172a;
        --muted: #b8c5d6;
        --muted-light: #475569;
        --accent: #22c55e;
        --accent-strong: #16a34a;
        --warn: #f59e0b;
        --danger: #ef4444;
        --border: rgba(148, 163, 184, 0.28);
        --shadow: 0 14px 30px rgba(0, 0, 0, 0.22);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: 'Fira Sans', Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: linear-gradient(180deg, var(--bg), #111827 68%);
        color: var(--text);
      }

      main {
        max-width: 1100px;
        margin: 0 auto;
        padding: 24px;
      }

      .hero,
      .card {
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: var(--shadow);
      }

      .hero {
        padding: 22px;
        background: linear-gradient(145deg, rgba(17, 24, 39, 0.98), rgba(24, 34, 53, 0.96));
      }

      .card {
        padding: 16px;
        background: linear-gradient(180deg, rgba(24, 34, 53, 0.98), rgba(17, 24, 39, 0.98));
      }

      .eyebrow {
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #86efac;
        font-size: 12px;
      }

      h1,
      h2,
      h3 {
        margin: 0;
        font-weight: 700;
      }

      h1 {
        font-size: 34px;
        margin-top: 10px;
        letter-spacing: 0;
      }

      h2 {
        font-size: 20px;
      }

      p {
        color: var(--muted);
        line-height: 1.6;
      }

      .toolbar {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 14px;
      }

      .grid {
        display: grid;
        gap: 18px;
        margin-top: 18px;
      }

      .grid.two {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      }

      .pill-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 16px;
      }

      .pill {
        padding: 8px 12px;
        border-radius: 8px;
        background: rgba(34, 197, 94, 0.12);
        border: 1px solid rgba(34, 197, 94, 0.28);
        color: var(--text);
        font-size: 12px;
      }

      .status-running {
        border-color: rgba(255, 209, 102, 0.4);
        color: var(--warn);
      }

      .status-success {
        border-color: rgba(126, 240, 200, 0.35);
      }

      .status-error {
        border-color: rgba(255, 123, 123, 0.4);
        color: var(--danger);
      }

      .status-warning {
        border-color: rgba(255, 209, 102, 0.4);
        color: var(--warn);
      }

      label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        color: var(--muted);
      }

      textarea {
        width: 100%;
        min-height: 120px;
        resize: vertical;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid var(--border);
        background: rgba(15, 23, 42, 0.88);
        color: var(--text);
        font: inherit;
        line-height: 1.5;
      }

      textarea:focus-visible,
      button:focus-visible,
      .history-item:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }

      button {
        border: 0;
        border-radius: 8px;
        min-height: 40px;
        padding: 10px 14px;
        background: var(--accent);
        color: #052e16;
        font-weight: 700;
        cursor: pointer;
        transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease;
      }

      button:hover:not(:disabled) {
        background: var(--accent-strong);
      }

      button.secondary {
        background: transparent;
        border: 1px solid var(--border);
        color: var(--text);
      }

      button.secondary:hover:not(:disabled) {
        border-color: rgba(34, 197, 94, 0.55);
        color: #bbf7d0;
      }

      button:disabled {
        opacity: 0.6;
        cursor: progress;
      }

      ol,
      ul {
        padding-left: 18px;
        margin: 12px 0 0;
      }

      li {
        margin-bottom: 8px;
        color: var(--muted);
      }

      code,
      pre {
        font-family: 'SFMono-Regular', Consolas, monospace;
      }

      pre {
        margin: 12px 0 0;
        padding: 14px;
        overflow-x: auto;
        border-radius: 8px;
        background: rgba(3, 7, 18, 0.78);
        border: 1px solid var(--border);
        color: #dffaf2;
        white-space: pre-wrap;
      }

      .history-list {
        display: grid;
        gap: 8px;
        margin-top: 12px;
      }

      .history-item {
        background: rgba(15, 23, 42, 0.74);
        border: 1px solid var(--border);
        border-radius: 8px;
        color: var(--text);
        cursor: pointer;
        display: grid;
        gap: 4px;
        padding: 10px;
        text-align: left;
        transition: border-color 180ms ease, background-color 180ms ease;
      }

      .history-item:hover {
        background: rgba(30, 41, 59, 0.88);
        border-color: rgba(34, 197, 94, 0.46);
      }

      .history-meta {
        color: var(--muted);
        font-family: 'Fira Code', 'SFMono-Regular', Consolas, monospace;
        font-size: 11px;
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 16px;
        color: var(--muted);
        font-size: 13px;
      }

      .error {
        margin-top: 12px;
        color: var(--danger);
      }

      .stack {
        display: grid;
        gap: 12px;
      }

      a {
        color: var(--accent);
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          transition: none !important;
        }
      }

      @media (max-width: 520px) {
        main {
          padding: 14px;
        }

        h1 {
          font-size: 28px;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <div class="eyebrow">Agentic Splunk Artifact Loop</div>
        <h1>SPL Forge</h1>
        <p>
          Prompt now generates SPL, executes it, inspects schema on failure or zero rows,
          repairs common field/index/sourcetype mistakes, and reruns with capped attempts.
          Final working SPL now produces dashboard, alert, and Splunk app export artifacts.
        </p>
        <div class="pill-row">
          <span class="pill">Mode: ${escapeHtml(config.splunkMode)}</span>
          <span class="pill">Source: ${escapeHtml(config.splunkSource)}</span>
          <span class="pill">Endpoint: ${escapeHtml(getSplunkEndpointLabel(config))}</span>
          <span class="pill">Repair: ${config.splunkRepairAutoRun ? 'auto-rerun' : 'approval required'}</span>
          <span class="pill">Provider: ${escapeHtml(config.llmProvider)}</span>
          <span class="pill">Model: ${escapeHtml(config.llmModel)}</span>
          <span class="pill status-${state.status}">Status: ${escapeHtml(statusLabel)}</span>
        </div>
      </section>

      <section class="grid two">
        <article class="card">
          <h2>Prompt</h2>
          <label for="prompt-input">Describe search, dashboard, or alert intent.</label>
          <textarea id="prompt-input" placeholder="Describe Splunk artifact you want...">${escapeHtml(state.lastPrompt)}</textarea>
          <div class="toolbar">
            <button id="generate-button"${state.status === 'running' ? ' disabled' : ''}>Generate + Run SPL</button>
            <button class="secondary" id="export-button"${canExport ? '' : ' disabled'}>Export App</button>
            <button class="secondary" id="publish-button"${canPublish ? '' : ' disabled'}>Publish to Splunk</button>
          </div>
          ${state.lastExport ? `<div class="meta"><span>Exported: <code>${escapeHtml(state.lastExport.root)}</code></span><span>${state.lastExport.fileCount} files</span></div>` : ''}
          ${state.lastPublish ? `<div class="meta"><span>Published: <code>${escapeHtml(state.lastPublish.published.join(', '))}</code></span><span>Reloaded: <code>${escapeHtml(state.lastPublish.reloaded.join(', ') || 'none')}</code></span>${state.lastPublish.dashboardUrl ? `<span><a href="${escapeHtml(state.lastPublish.dashboardUrl)}">Open dashboard</a></span>` : ''}</div>` : ''}
          ${state.lastError ? `<div class="error">${escapeHtml(state.lastError)}</div>` : ''}
        </article>

        <article class="card">
          <h2>Workflow</h2>
          <ul>
            <li>Natural-language prompt accepted in panel</li>
            <li>Intent parser and LLM adapter generate SPL</li>
            <li>Execution adapter routes through mock, REST, or MCP mode</li>
            <li>Schema inspection runs after failed or empty execution</li>
            <li>Repair loop rewrites common field, index, sourcetype, action, and time-window problems</li>
            <li>Final successful SPL replaces initial failed candidate</li>
            <li>Provider + model logged in output channel</li>
            <li>Result rows or execution errors visible in panel</li>
            <li>Dashboard and alert artifacts previewed from final SPL</li>
            <li>Export App writes importable Splunk app folder from current result</li>
            <li>Publish to Splunk writes dashboard and disabled alert through REST, then reloads those knowledge-object endpoints</li>
          </ul>
        </article>
      </section>

      <section class="grid two">
        <article class="card">
          <h2>Query History</h2>
          <div class="history-list">
            ${historyMarkup}
          </div>
        </article>

        <article class="card">
          <h2>Error Log</h2>
          <pre>${escapeHtml(formatErrorLog(state))}</pre>
        </article>
      </section>

      <section class="grid two">
        <article class="card">
          <h2>Query Plan</h2>
          <pre>${escapeHtml(state.lastPlanSummary ?? 'Intent summary will render here after prompt run.')}</pre>
        </article>

        <article class="card">
          <h2>Raw Provider Output</h2>
          <div class="stack">
            <div>Last provider: <code>${escapeHtml(state.lastProvider ?? 'none yet')}</code></div>
            <pre>${escapeHtml(state.lastRawText ?? 'No generation yet. Submit prompt to generate and run SPL.')}</pre>
          </div>
        </article>

        <article class="card">
          <h2>Parsed SPL</h2>
          <pre>${escapeHtml(state.lastSpl ?? 'Parsed SPL will render here after prompt run.')}</pre>
        </article>

        <article class="card">
          <h2>Repair History</h2>
          <pre>${escapeHtml(state.lastRepairSummary ?? 'Repair history will render here after prompt run.')}</pre>
        </article>
      </section>

      <section class="grid two">
        <article class="card">
          <h2>Execution Summary</h2>
          <pre>${escapeHtml(formatExecutionSummary(state.lastExecution))}</pre>
        </article>

        <article class="card">
          <h2>Result Preview</h2>
          <pre>${escapeHtml(formatRows(state.lastExecution))}</pre>
        </article>
      </section>

      <section class="grid two">
        <article class="card">
          <h2>Dashboard Artifact</h2>
          <pre>${escapeHtml(formatDashboardArtifact(state.lastDashboard))}</pre>
        </article>

        <article class="card">
          <h2>Alert Artifact</h2>
          <pre>${escapeHtml(formatAlertArtifact(state.lastAlert))}</pre>
        </article>
      </section>

      <section class="grid two">
        <article class="card">
          <h2>Next Build Targets</h2>
          <ol>
            <li>Zip package download</li>
            <li>Human approval gate before enabling alerts</li>
            <li>Dashboard import validation from panel</li>
          </ol>
        </article>
      </section>

      <section class="card">
        <h2>Repo Pointers</h2>
        <ul>
          <li><a href="https://github.com/Utpal-Kalita/SPL-Forge">Repository origin</a></li>
          <li>Docs: <code>docs/FREE_TRIAL_SETUP.md</code>, <code>docs/SPLUNK_SETUP.md</code>, <code>docs/ARCHITECTURE.md</code></li>
          <li>Sample data: <code>samples/failed_login_auth.csv</code></li>
          <li>Next modules: <code>src/agent</code>, <code>src/config</code>, <code>src/splunk</code>, <code>src/artifacts</code></li>
        </ul>
        <div class="meta">
          <span>Command: <code>SPL Forge: Open Panel</code></span>
          <span>Activation: <code>spl-forge.openPanel</code></span>
          <span>Workspace: <code>${escapeHtml(config.workspaceName)}</code></span>
          <span>Path: <code>${escapeHtml(extensionUri)}</code></span>
        </div>
      </section>
    </main>

    <script nonce="splforge">
      const vscode = acquireVsCodeApi();
      const promptInput = document.getElementById('prompt-input');
      const generateButton = document.getElementById('generate-button');
      const exportButton = document.getElementById('export-button');
      const publishButton = document.getElementById('publish-button');

      generateButton?.addEventListener('click', () => {
        const prompt = promptInput?.value ?? '';
        vscode.postMessage({
          type: 'submitPrompt',
          prompt,
        });
      });

      exportButton?.addEventListener('click', () => {
        vscode.postMessage({
          type: 'exportApp',
        });
      });

      publishButton?.addEventListener('click', () => {
        vscode.postMessage({
          type: 'publishApp',
        });
      });

      document.querySelectorAll('[data-history-index]').forEach((item) => {
        item.addEventListener('click', () => {
          const index = Number(item.getAttribute('data-history-index'));
          vscode.postMessage({
            type: 'restoreHistory',
            index,
          });
        });
      });
    </script>
  </body>
</html>`;
}

function getStatusLabel(status: PanelState['status']) {
  switch (status) {
    case 'running':
      return 'running';
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    case 'idle':
    default:
      return 'idle';
  }
}

function getSplunkEndpointLabel(config: ForgeConfig) {
  if (config.splunkMode === 'mcp') {
    return config.splunkMcpEndpoint ?? 'mcp endpoint not configured';
  }

  if (config.splunkMode === 'rest') {
    return config.splunkUrl;
  }

  return 'mock';
}

function formatExecutionSummary(execution: SplunkSearchResult | undefined) {
  if (!execution) {
    return 'Execution summary will render here after prompt run.';
  }

  return [
    `Mode: ${execution.mode}`,
    `Status: ${execution.status}`,
    `Rows: ${execution.rowCount}`,
    `Elapsed: ${execution.elapsedMs}ms`,
    `Fields: ${execution.fields.length > 0 ? execution.fields.join(', ') : 'none'}`,
    `Messages: ${execution.messages.length > 0 ? execution.messages.join(' | ') : 'none'}`,
  ].join('\n');
}

function formatRows(execution: SplunkSearchResult | undefined) {
  if (!execution) {
    return 'Result rows will render here after execution.';
  }

  if (execution.rows.length === 0) {
    return execution.status === 'success' ? 'Search completed with zero rows.' : 'No rows because execution failed.';
  }

  return JSON.stringify(execution.rows.slice(0, 10), null, 2);
}

function formatDashboardArtifact(dashboard: DashboardArtifact | undefined) {
  if (!dashboard) {
    return 'Dashboard JSON will render here when prompt asks for dashboard or visualization.';
  }

  return [
    `Title: ${dashboard.title}`,
    `View: ${dashboard.viewName}`,
    `Visualization: ${dashboard.visualizationType}`,
    `Fields: ${dashboard.fields.length > 0 ? dashboard.fields.join(', ') : 'none'}`,
    '',
    dashboard.dashboardJson,
    '',
    'Classic XML for Splunk UI load:',
    dashboard.classicXml,
  ].join('\n');
}

function formatAlertArtifact(alert: AlertArtifact | undefined) {
  if (!alert) {
    return 'Alert saved-search draft will render here when prompt includes threshold or alert intent.';
  }

  return [
    `Title: ${alert.title}`,
    `Condition: ${alert.condition}`,
    `Schedule: ${alert.cronSchedule}`,
    '',
    alert.savedSearchConf,
  ].join('\n');
}

function formatHistory(history: HistoryItem[]) {
  if (history.length === 0) {
    return '<div class="history-meta">No prompt history yet.</div>';
  }

  return history
    .map((item, index) => [
      `<button class="history-item" data-history-index="${index}">`,
      `<span>${escapeHtml(item.prompt)}</span>`,
      `<span class="history-meta">${escapeHtml(item.timestamp)} | ${escapeHtml(item.status)} | ${item.rowCount} rows | ${item.elapsedMs}ms</span>`,
      '</button>',
    ].join(''))
    .join('');
}

function formatErrorLog(state: PanelState) {
  const lines = [
    `Panel status: ${state.status}`,
    `Last repair: ${state.lastRepairSummary ?? 'none'}`,
  ];

  if (state.lastExecution?.messages.length) {
    lines.push(`Splunk messages: ${state.lastExecution.messages.join(' | ')}`);
  }

  if (state.lastError) {
    lines.push(`Panel error: ${state.lastError}`);
  }

  return lines.join('\n');
}

function isPromptMessage(message: unknown): message is { prompt: string; type: 'submitPrompt' } {
  return typeof message === 'object'
    && message !== null
    && 'type' in message
    && 'prompt' in message
    && message.type === 'submitPrompt'
    && typeof message.prompt === 'string';
}

function isExportMessage(message: unknown): message is { type: 'exportApp' } {
  return typeof message === 'object'
    && message !== null
    && 'type' in message
    && message.type === 'exportApp';
}

function isPublishMessage(message: unknown): message is { type: 'publishApp' } {
  return typeof message === 'object'
    && message !== null
    && 'type' in message
    && message.type === 'publishApp';
}

function isHistoryMessage(message: unknown): message is { index: number; type: 'restoreHistory' } {
  return typeof message === 'object'
    && message !== null
    && 'type' in message
    && 'index' in message
    && message.type === 'restoreHistory'
    && typeof message.index === 'number';
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
