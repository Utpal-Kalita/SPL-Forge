# VS Code Setup Guide

This guide explains how to clone **SPL Forge**, configure VS Code, install the required tooling, and start local development immediately.

SPL Forge is currently structured as a **TypeScript-based VS Code extension project**. The main extension entry point is `src/extension.ts`, with project documentation stored in `docs/` and extension packaging/build configuration at the repository root.

---

## 1. Prerequisites

Install the following before cloning the project:

- **Git** — for cloning, branching, and contributing through GitHub.
- **Node.js LTS** — recommended for VS Code extension development.
- **npm** — included with Node.js and used for dependency management.
- **Visual Studio Code** — primary development environment.
- **Splunk environment** — local Splunk Enterprise, Splunk Cloud access, or a prepared walkthrough/search-head environment.
- **Splunk Enterprise free trial** — recommended local Splunk base before applying Developer License.

Verify the basics:

```bash
git --version
node --version
npm --version
code --version
```

---

## 2. Clone the Repository

```bash
git clone https://github.com/Utpal-Kalita/SPL-Forge SPL-Forge
cd SPL-Forge
code .
```

After opening the folder in VS Code, make sure the workspace root is the `SPL-Forge/` directory, not `docs/` or `src/`.

---

## 3. Project Structure

Current repository layout:

```text
SPL-Forge/
├── .github/                    # GitHub configuration
├── .vscode/                    # VS Code workspace settings, launch configs, tasks
├── .gitignore                  # Git ignore rules
├── .vscode-test.mjs            # VS Code test configuration
├── .vscodeignore               # Files ignored during extension packaging
├── assets/                     # Brand assets and images
│   └── spl-forge-banner.png    # Project banner
├── docs/                       # Project documentation
│   ├── PROGRESS.md             # Progress tracking
│   ├── QUICKSTART.md           # Quick start guide
│   ├── VS_CODE_SETUP.md        # VS Code setup guide
│   ├── SPLUNK_SETUP.md         # Splunk environment setup
│   ├── ARCHITECTURE.md         # System architecture
│   └── WALKTHROUGH_RUNBOOK.md         # Product workflow walkthrough
├── src/                        # Extension source code
│   ├── agent/                  # SPL generation and prompt handling
│   ├── config/                 # Runtime environment loader
│   ├── panels/                 # VS Code webview panel
│   ├── splunk/                 # Mock/REST execution adapters
│   ├── extension.ts            # Main VS Code extension entry point
│   └── test/                   # Extension tests
├── package.json                # Extension metadata, commands, scripts, dependencies
├── package-lock.json           # Locked npm dependency versions
├── tsconfig.json               # TypeScript compiler configuration
├── esbuild.js                  # Extension build configuration
├── eslint.config.mjs           # ESLint configuration
├── README.md                   # Main project documentation
├── CHANGELOG.md                # Version history
├── vsc-extension-quickstart.md # VS Code extension quickstart
├── ROADMAP.md                  # Release and future roadmap
└── PRD.md                      # Product requirements
```

---

## 4. Recommended VS Code Extensions

Install these extensions for the best development experience:

### Required

- **ESLint** — validates TypeScript and project lint rules.
- **Prettier** — consistent formatting for Markdown, JSON, and TypeScript.
- **GitHub Pull Requests and Issues** — manage GitHub issues and PRs from VS Code.
- **npm Intellisense** — improves package imports and npm workflow.
- **Path Intellisense** — autocompletes local file paths.

### Recommended for SPL Forge

- **Markdown All in One** — better documentation editing.
- **Splunk Extension** — official Splunk VS Code extension for app and search workflows.
- **REST Client** — useful for testing Splunk REST API calls from `.http` files.
- **GitLens** — better Git history, blame, and branch review.
- **Error Lens** — shows TypeScript and ESLint issues inline.

Install from the VS Code Extensions panel or with the CLI:

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension GitHub.vscode-pull-request-github
code --install-extension christian-kohler.npm-intellisense
code --install-extension christian-kohler.path-intellisense
code --install-extension yzhang.markdown-all-in-one
code --install-extension Splunk.splunk
code --install-extension humao.rest-client
code --install-extension eamodio.gitlens
code --install-extension usernamehw.errorlens
```

---

## 5. Install Dependencies

From the repository root:

```bash
npm install
```

This installs all dependencies from `package.json` and uses `package-lock.json` to keep versions reproducible.

Do not manually edit `package-lock.json` unless you are intentionally updating dependencies.

---

## 6. VS Code Workspace Configuration

The `.vscode/` directory should contain project-specific editor, launch, and task configuration.

Recommended workspace behavior:

- Format TypeScript and Markdown on save.
- Use ESLint for diagnostics.
- Use the root `tsconfig.json` for TypeScript validation.
- Launch the extension using VS Code’s Extension Development Host.

A useful `.vscode/settings.json` baseline:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.exclude": {
    "out": true,
    "dist": true,
    "node_modules": true
  }
}
```

A useful `.vscode/launch.json` baseline for extension debugging:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run SPL Forge Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
      "outFiles": ["${workspaceFolder}/dist/**/*.js", "${workspaceFolder}/out/**/*.js"],
      "preLaunchTask": "npm: watch"
    }
  ]
}
```

If this project uses `esbuild.js` to output into `dist/`, prefer `dist/**/*.js`. If it compiles into `out/`, keep `out/**/*.js`.

---

## 7. Development Terminal Workflow

Use the VS Code integrated terminal from the repository root.

Recommended terminal split:

### Terminal 1 — Watch Build

```bash
npm run watch
```

Use this while actively editing `src/extension.ts` or other TypeScript files.

### Terminal 2 — Lint and Test

```bash
npm run lint
npm test
```

Run these before committing changes.

### Terminal 3 — Git Workflow

```bash
git status
git checkout -b feature/<short-feature-name>
git add .
git commit -m "feat: describe the change"
git push origin feature/<short-feature-name>
```

---

## 8. Running the Extension Locally

1. Open `SPL-Forge/` in VS Code.
2. Run:

   ```bash
   npm install
   npm run watch
   ```

3. Press **F5**.
4. A new VS Code window opens: **Extension Development Host**.
5. Open the Command Palette in that new window:

   ```text
   Ctrl+Shift+P / Cmd+Shift+P
   ```

6. Search for SPL Forge commands registered in `package.json`.
7. Run the command and test the extension behavior.

When changing extension code, reload the Extension Development Host:

```text
Ctrl+R / Cmd+R
```

---

## 9. Important Files for Extension Development

### `package.json`

Defines:

- Extension name, display name, version, publisher, and metadata.
- VS Code activation events.
- Commands exposed to the Command Palette.
- Menus, views, configuration, and contribution points.
- npm scripts such as build, watch, lint, and test.
- Runtime and development dependencies.

### `src/extension.ts`

Main extension entry point. This is where SPL Forge should register commands, initialize providers, connect to services, and activate core features.

Typical responsibilities:

- Register VS Code commands.
- Read user/workspace configuration.
- Start local orchestration logic.
- Connect to Splunk APIs or local helper services.
- Coordinate future MCP/server integrations.

### `src/test/`

Contains extension tests. Use this for command behavior, activation checks, and future integration tests.

### `esbuild.js`

Controls bundling for the extension. Use this when adding dependencies, changing the output directory, or optimizing package size.

### `.vscodeignore`

Controls what is excluded when packaging the extension. Keep unnecessary files, screenshots, local configs, and development-only assets out of the final `.vsix` package.

---

## 10. Splunk Configuration

Use `docs/SPLUNK_SETUP.md` for environment-specific instructions.

At a minimum, developers should prepare:

- Splunk base URL.
- Authentication method.
- App/index/sourcetype names used for testing.
- Saved searches or sample SPL queries.
- Validation data or mock events.

Recommended local environment variables:

```bash
SPLUNK_HOST=https://localhost:8089
SPLUNK_USERNAME=admin
SPLUNK_PASSWORD=<local-password>
SPLUNK_INDEX=main
SPL_FORGE_ENV=development
```

Do not commit secrets to GitHub. Use local environment variables, VS Code secret storage, `.env.local`, or OS-level credential managers.

If `.env.local` is used, make sure it is ignored by Git.

---

## 11. MCP and Agentic Tooling Notes

SPL Forge is intended to grow into an agentic operations workflow around Splunk.

The VS Code extension should eventually act as the developer-facing control surface for:

- SPL generation and validation.
- Splunk search execution.
- Incident investigation workflows.
- MCP server orchestration.
- Guardrail checks for generated searches.
- Prompt and runbook-driven troubleshooting.
- Walkthrough flows documented in `docs/WALKTHROUGH_RUNBOOK.md`.

Recommended future folders if MCP tooling is added:

```text
mcp/              # MCP server implementations
prompts/          # Prompt templates and evaluation prompts
guardrails/       # SPL validation, safety rules, and policy checks
examples/         # Walkthrough payloads, saved searches, and sample incidents
```

Until those folders exist, keep MCP-specific implementation notes in `docs/ARCHITECTURE.md` or `docs/PROGRESS.md`.

---

## 12. GitHub Workflow

Use short-lived feature branches:

```bash
git checkout -b feature/spl-query-validator
```

Recommended commit style:

```text
feat: add SPL validation command
fix: handle missing Splunk host configuration
docs: update VS Code setup guide
test: add extension activation test
chore: update build configuration
```

Before opening a pull request:

```bash
npm run lint
npm test
npm run compile
```

A good pull request should include:

- Clear summary of what changed.
- Screenshots or walkthrough notes for UI behavior.
- Testing steps.
- Any Splunk setup assumptions.
- Related issue or roadmap item.

---

## 13. Packaging the Extension

For local testing as a VS Code extension package, use VS Code’s official packaging tool:

```bash
npm install --save-dev @vscode/vsce
npx vsce package
```

This creates a `.vsix` file that can be installed manually in VS Code.

Install locally:

```bash
code --install-extension spl-forge-*.vsix
```

Before packaging, check `.vscodeignore` to avoid shipping unnecessary files.

---

## 14. Common Problems

### Extension command does not appear

Check `package.json`:

- The command must be listed under `contributes.commands`.
- The activation event must match the command or extension behavior.
- The command must be registered in `src/extension.ts`.

Then reload the Extension Development Host.

### TypeScript errors are not updating

Run:

```bash
npm run watch
```

Then restart the TypeScript server from the Command Palette:

```text
TypeScript: Restart TS Server
```

### ESLint is not working

Confirm dependencies are installed:

```bash
npm install
```

Then check that the ESLint extension is installed and enabled.

### Extension launches but old behavior remains

Reload the Extension Development Host:

```text
Ctrl+R / Cmd+R
```

If needed, stop and restart `npm run watch`.

### Splunk connection fails

Check:

- Splunk host URL.
- Port availability.
- Username/password or token.
- SSL certificate settings for local Splunk.
- Network access if using Splunk Cloud.
- Index and permissions for the test account.

---

## 15. Fast Start Checklist

Use this checklist when setting up a new machine:

```text
[ ] Install Git, Node.js LTS, npm, and VS Code
[ ] Clone the SPL-Forge repository
[ ] Open the repository root in VS Code
[ ] Install recommended VS Code extensions
[ ] Run npm install
[ ] Run npm run watch
[ ] Press F5 to open Extension Development Host
[ ] Run SPL Forge command from Command Palette
[ ] Configure Splunk credentials locally
[ ] Run npm run lint and npm test before committing
```

---

## 16. Related Documentation

Read these next:

- `README.md` — project overview.
- `docs/QUICKSTART.md` — shortest path to a working walkthrough.
- `docs/SPLUNK_SETUP.md` — Splunk-specific setup.
- `docs/ARCHITECTURE.md` — system design.
- `docs/WALKTHROUGH_RUNBOOK.md` — product workflow walkthrough.
- `docs/PROGRESS.md` — current build progress.
- `ROADMAP.md` — release and future direction.
- `PRD.md` — product requirements.
