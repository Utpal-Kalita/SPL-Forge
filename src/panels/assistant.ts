import * as vscode from 'vscode';

const panelType = 'splForgeAssistant';

export class SPLForgePanel {
  private static currentPanel: SPLForgePanel | undefined;

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
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
        enableScripts: false,
        retainContextWhenHidden: true,
      },
    );

    SPLForgePanel.currentPanel = new SPLForgePanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this.panel = panel;
    this.extensionUri = extensionUri;

    this.render();
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.onDidChangeViewState(() => this.render(), null, this.disposables);
  }

  public dispose() {
    SPLForgePanel.currentPanel = undefined;

    this.panel.dispose();

    while (this.disposables.length > 0) {
      const disposable = this.disposables.pop();
      disposable?.dispose();
    }
  }

  private render() {
    const workspaceName = vscode.workspace.workspaceFolders?.[0]?.name ?? 'workspace';
    const mode = process.env.SPL_FORGE_SPLUNK_MODE ?? 'rest';
    const source = process.env.SPL_FORGE_SPLUNK_SOURCE ?? 'self_hosted_trial';

    this.panel.webview.html = getPanelHtml({
      workspaceName,
      mode,
      source,
      cspSource: this.panel.webview.cspSource,
      extensionUri: this.extensionUri.toString(),
    });
  }
}

type PanelHtmlInput = {
  cspSource: string;
  extensionUri: string;
  mode: string;
  source: string;
  workspaceName: string;
};

export function getPanelHtml(input: PanelHtmlInput) {
  const { cspSource, extensionUri, mode, source, workspaceName } = input;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; img-src ${cspSource} https: data:;"
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
        max-width: 1024px;
        margin: 0 auto;
        padding: 28px;
      }

      .hero {
        padding: 24px;
        border: 1px solid var(--border);
        border-radius: 24px;
        background: linear-gradient(145deg, rgba(19, 44, 56, 0.96), rgba(12, 26, 34, 0.92));
        box-shadow: var(--shadow);
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
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      }

      .card {
        padding: 18px;
        border-radius: 20px;
        border: 1px solid var(--border);
        background: linear-gradient(180deg, rgba(23, 53, 68, 0.96), rgba(13, 32, 41, 0.96));
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
      }

      .loop {
        display: grid;
        gap: 10px;
        margin-top: 14px;
      }

      .loop span {
        display: block;
        padding: 12px 14px;
        border-radius: 14px;
        background: rgba(126, 240, 200, 0.08);
        border: 1px solid rgba(126, 240, 200, 0.18);
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 16px;
        color: var(--muted);
        font-size: 13px;
      }

      a {
        color: var(--accent);
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <div class="eyebrow">Day 1 scaffold ready</div>
        <h1>SPL Forge</h1>
        <p>
          Workspace <strong>${escapeHtml(workspaceName)}</strong> now has real VS Code panel scaffold,
          sample auth dataset, free-trial-first setup path, architecture draft, next-step targets.
        </p>
        <div class="pill-row">
          <span class="pill">Mode: ${escapeHtml(mode)}</span>
          <span class="pill">Source: ${escapeHtml(source)}</span>
          <span class="pill">Path: ${escapeHtml(extensionUri)}</span>
        </div>
      </section>

      <section class="grid two">
        <article class="card">
          <h2>Core Loop</h2>
          <div class="loop">
            <span>1. Prompt enters panel</span>
            <span>2. LLM drafts candidate SPL</span>
            <span>3. Splunk adapter runs query</span>
            <span>4. Error or empty result captured</span>
            <span>5. Repair loop rewrites SPL</span>
            <span>6. Final query previews for export</span>
          </div>
        </article>

        <article class="card">
          <h2>Day 1 Checklist</h2>
          <ul>
            <li>VS Code extension scaffold active</li>
            <li>Webview panel opens from command palette</li>
            <li>Sample auth data fixture added for failed-login demo</li>
            <li>Architecture draft documented in repo</li>
            <li>Free trial + Developer License setup documented</li>
          </ul>
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
            <li>LLM provider adapter and prompt pipeline</li>
            <li>Mock Splunk adapter for deterministic demo loop</li>
            <li>REST adapter for live Splunk execution</li>
            <li>Repair pass for wrong field or sourcetype</li>
          </ol>
        </article>
      </section>

      <section class="card">
        <h2>Repo Pointers</h2>
        <ul>
          <li><a href="https://github.com/Utpal-Kalita/SPL-Forge">Repository origin</a></li>
          <li>Docs: <code>docs/FREE_TRIAL_SETUP.md</code>, <code>docs/SPLUNK_SETUP.md</code>, <code>docs/ARCHITECTURE.md</code></li>
          <li>Sample data: <code>samples/failed_login_auth.csv</code></li>
          <li>Next modules: <code>src/panels</code>, <code>src/agent</code>, <code>src/splunk</code>, <code>src/artifacts</code></li>
        </ul>
        <div class="meta">
          <span>Command: <code>SPL Forge: Open Panel</code></span>
          <span>Activation: <code>spl-forge.openPanel</code></span>
        </div>
      </section>
    </main>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
