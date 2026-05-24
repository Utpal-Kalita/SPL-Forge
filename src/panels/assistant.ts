import * as vscode from 'vscode';
import type { ForgeConfig } from '../config/env';

const panelType = 'splForgeAssistant';
const defaultPrompt = 'Create a failed login dashboard by country and user agent. Alert if failed attempts exceed 100 in 5 minutes.';

type PromptResult = {
  llmModel: string;
  providerLabel: string;
  rawText: string;
  spl: string;
};

type PanelDependencies = {
  extensionUri: vscode.Uri;
  onSubmitPrompt(prompt: string): Promise<PromptResult>;
  readConfig(): ForgeConfig;
};

type PanelState = {
  lastPrompt: string;
  lastRawText?: string;
  lastSpl?: string;
  lastProvider?: string;
  lastError?: string;
  status: 'idle' | 'running' | 'success' | 'error';
};

export class SPLForgePanel {
  private static currentPanel: SPLForgePanel | undefined;

  private readonly dependencies: PanelDependencies;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly panel: vscode.WebviewPanel;
  private state: PanelState = {
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
        lastError: undefined,
        lastPrompt: prompt,
        lastProvider: `${result.providerLabel} / ${result.llmModel}`,
        lastRawText: result.rawText,
        lastSpl: result.spl,
        status: 'success',
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
        --bg: #08131a;
        --bg-soft: #0f2029;
        --card: #132c38;
        --card-alt: #173544;
        --text: #f2f7f9;
        --muted: #b7cad3;
        --accent: #7ef0c8;
        --accent-strong: #20c997;
        --warn: #ffd166;
        --danger: #ff7b7b;
        --border: rgba(255, 255, 255, 0.1);
        --shadow: 0 18px 40px rgba(0, 0, 0, 0.24);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: Georgia, 'Times New Roman', serif;
        background:
          radial-gradient(circle at top right, rgba(126, 240, 200, 0.18), transparent 30%),
          linear-gradient(180deg, var(--bg), #060d12 62%);
        color: var(--text);
      }

      main {
        max-width: 1100px;
        margin: 0 auto;
        padding: 28px;
      }

      .hero,
      .card {
        border: 1px solid var(--border);
        border-radius: 24px;
        box-shadow: var(--shadow);
      }

      .hero {
        padding: 24px;
        background: linear-gradient(145deg, rgba(19, 44, 56, 0.96), rgba(12, 26, 34, 0.92));
      }

      .card {
        padding: 18px;
        background: linear-gradient(180deg, rgba(23, 53, 68, 0.96), rgba(13, 32, 41, 0.96));
      }

      .eyebrow {
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--accent);
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
      }

      h2 {
        font-size: 20px;
      }

      p {
        color: var(--muted);
        line-height: 1.6;
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
        border-radius: 999px;
        background: rgba(126, 240, 200, 0.12);
        border: 1px solid rgba(126, 240, 200, 0.25);
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
        padding: 14px;
        border-radius: 18px;
        border: 1px solid var(--border);
        background: rgba(4, 13, 18, 0.8);
        color: var(--text);
        font: inherit;
        line-height: 1.5;
      }

      button {
        margin-top: 14px;
        border: 0;
        border-radius: 999px;
        padding: 12px 18px;
        background: linear-gradient(135deg, var(--accent), var(--accent-strong));
        color: #03281e;
        font-weight: 700;
        cursor: pointer;
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
        border-radius: 16px;
        background: rgba(3, 9, 12, 0.65);
        border: 1px solid var(--border);
        color: #dffaf2;
        white-space: pre-wrap;
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
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <div class="eyebrow">Day 2 LLM integration</div>
        <h1>SPL Forge</h1>
        <p>
          Prompt now flows from panel into extension runtime. Day 2 target:
          natural-language in, raw SPL out, provider logged.
        </p>
        <div class="pill-row">
          <span class="pill">Mode: ${escapeHtml(config.splunkMode)}</span>
          <span class="pill">Source: ${escapeHtml(config.splunkSource)}</span>
          <span class="pill">Provider: ${escapeHtml(config.llmProvider)}</span>
          <span class="pill">Model: ${escapeHtml(config.llmProvider === 'gemini' ? config.geminiModel : config.llmModel)}</span>
          <span class="pill status-${state.status}">Status: ${escapeHtml(statusLabel)}</span>
        </div>
      </section>

      <section class="grid two">
        <article class="card">
          <h2>Prompt</h2>
          <label for="prompt-input">Describe search, dashboard, or alert intent.</label>
          <textarea id="prompt-input" placeholder="Describe Splunk artifact you want...">${escapeHtml(state.lastPrompt)}</textarea>
          <button id="generate-button"${state.status === 'running' ? ' disabled' : ''}>Generate Raw SPL</button>
          ${state.lastError ? `<div class="error">${escapeHtml(state.lastError)}</div>` : ''}
        </article>

        <article class="card">
          <h2>Day 2 Checklist</h2>
          <ul>
            <li>Natural-language prompt accepted in panel</li>
            <li>Webview posts message into extension runtime</li>
            <li>LLM adapter or mock fallback returns raw SPL string</li>
            <li>Provider + model logged in output channel</li>
            <li>Raw result visible without Splunk execution yet</li>
          </ul>
        </article>
      </section>

      <section class="grid two">
        <article class="card">
          <h2>Raw Provider Output</h2>
          <div class="stack">
            <div>Last provider: <code>${escapeHtml(state.lastProvider ?? 'none yet')}</code></div>
            <pre>${escapeHtml(state.lastRawText ?? 'No generation yet. Submit prompt to test Day 2 flow.')}</pre>
          </div>
        </article>

        <article class="card">
          <h2>Parsed SPL</h2>
          <pre>${escapeHtml(state.lastSpl ?? 'Parsed SPL will render here after prompt submission.')}</pre>
        </article>
      </section>

      <section class="grid two">
        <article class="card">
          <h2>Prompt Target</h2>
          <pre>Create a failed login dashboard by country and user agent.
Alert if failed attempts exceed 100 in 5 minutes.</pre>
        </article>

        <article class="card">
          <h2>Next Build Targets</h2>
          <ol>
            <li>Prompt templates tuned for Day 3 query quality</li>
            <li>Mock Splunk adapter for deterministic run loop</li>
            <li>REST adapter for live Splunk execution</li>
            <li>Repair loop for field and sourcetype failures</li>
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

      generateButton?.addEventListener('click', () => {
        const prompt = promptInput?.value ?? '';
        vscode.postMessage({
          type: 'submitPrompt',
          prompt,
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
    case 'error':
      return 'error';
    case 'idle':
    default:
      return 'idle';
  }
}

function isPromptMessage(message: unknown): message is { prompt: string; type: 'submitPrompt' } {
  return typeof message === 'object'
    && message !== null
    && 'type' in message
    && 'prompt' in message
    && message.type === 'submitPrompt'
    && typeof message.prompt === 'string';
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
