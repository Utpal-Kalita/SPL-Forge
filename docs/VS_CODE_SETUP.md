# VS Code Setup

This guide prepares local editor environment for building SPL Forge as VS Code extension.

## Prerequisites

- VS Code latest stable
- Node.js 20 or newer
- npm 10 or newer
- Git
- GitHub CLI optional but recommended

## Recommended VS Code Extensions

- Splunk Extension for Visual Studio Code
- ESLint
- Prettier
- GitHub Pull Requests and Issues
- Error Lens

## Local Machine Checklist

Verify tools:

```bash
node -v
npm -v
git --version
code --version
```

## Workspace Setup

Clone repository and open in VS Code:

```bash
git clone https://github.com/Utpal-Kalita/SPL-Forge.git
cd SPL-Forge
code .
```

## Suggested Project Structure

When implementation begins, use structure close to below:

```text
spl-forge/
├─ src/
│  ├─ extension.ts
│  ├─ agent/
│  ├─ splunk/
│  ├─ artifacts/
│  └─ panels/
├─ webview-ui/
├─ docs/
└─ assets/
```

## Extension Development Host

Recommended workflow:

1. Open project in VS Code.
2. Add extension scaffold.
3. Press `F5` to launch Extension Development Host.
4. Use Command Palette for SPL Forge commands.

## Suggested Settings

Example user settings for cleaner extension work:

```json
{
  "editor.formatOnSave": true,
  "files.trimTrailingWhitespace": true,
  "typescript.tsdk": "node_modules/typescript/lib",
  "eslint.validate": ["javascript", "typescript", "typescriptreact"]
}
```

## Recommended Environment Variables

Do not commit secrets. Use local environment or VS Code secret storage.

Typical values:

```text
SPLUNK_BASE_URL=https://your-splunk-instance:8089
SPLUNK_USERNAME=admin
SPLUNK_PASSWORD=local-dev-password
OPENAI_API_KEY=your-model-key
```

If using MCP, prefer token-based secure configuration over hardcoded credentials.

## Build Priorities Inside VS Code

1. Command registration
2. Prompt input panel
3. Query generation service
4. Splunk execution adapter
5. Self-repair loop
6. Result preview
7. Export actions

## Common Pitfalls

- Mixing extension host code with webview-only code
- Storing Splunk credentials in tracked files
- Building UI before query execution path works
- Skipping mock mode for demos

## Best Practice

Start with mock mode first. Then add REST fallback. Then wire MCP path.

## Related Docs

- [`SPLUNK_SETUP.md`](./SPLUNK_SETUP.md)
- [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`DEMO_RUNBOOK.md`](./DEMO_RUNBOOK.md)
