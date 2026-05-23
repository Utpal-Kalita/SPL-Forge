<img src="./assets/spl-forge-banner.png" alt="SPL Forge — Self-debugging agentic IDE for Splunk development" width="100%" />

<div align="center">

# SPL Forge

**A self-debugging agentic IDE for building Splunk searches, dashboards, alerts, and apps from natural language.**

[![Built for Splunk](https://img.shields.io/badge/Built%20for-Splunk-00B140?style=flat-square)](#)
[![VS Code](https://img.shields.io/badge/VS%20Code-Extension-007ACC?style=flat-square)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=flat-square)](#)
[![MCP](https://img.shields.io/badge/MCP-Agentic%20Ops-7C5CFF?style=flat-square)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-black?style=flat-square)](LICENSE)

</div>

---

## What is SPL Forge?

SPL Forge turns a plain-English request into a working Splunk artifact.

It generates SPL, runs it against Splunk, detects broken fields or query errors, repairs itself using schema context, then exports dashboards, alerts, saved searches, or app-ready files — all from inside VS Code.

```text
Intent → Generate SPL → Execute → Inspect → Repair → Preview → Export
```

## Key Features

- **Natural language to SPL** — describe the result, not the syntax.
- **Self-debugging loop** — runs queries, reads failures, and repairs them.
- **Splunk-aware introspection** — discovers indexes, sourcetypes, and fields.
- **Artifact export** — creates dashboard, alert, and app folder outputs.
- **Human-in-the-loop** — review every query and export before using it.
- **Demo-safe modes** — supports MCP, REST fallback, or mock data.

## Tech Stack

| Layer | Choice |
|---|---|
| IDE | VS Code Extension API |
| Language | TypeScript + Node.js 20+ |
| UI | VS Code Webview + React + Vite |
| Validation | Zod |
| Splunk Access | Splunk MCP Server, REST fallback, MockConnector |
| AI Layer | Splunk Hosted Models or provider adapter |
| Packaging | JSZip + local Splunk app export |
| Testing | Vitest + ESLint |

## Quick Setup

```bash
# clone the repo
 git clone https://github.com/your-org/spl-forge.git
 cd spl-forge

# install extension dependencies
 npm install

# optional: install webview UI dependencies
 cd webview-ui && npm install && cd ..

# run in VS Code Extension Development Host
 code .
```

Press `F5` in VS Code, then open the Command Palette:

```text
SPL Forge: Open Assistant
```

## Configure

Create or update your local extension settings:

```json
{
  "splForge.connectionMode": "mock",
  "splForge.splunkBaseUrl": "https://your-splunk.example.com",
  "splForge.defaultIndex": "main"
}
```

For a live Splunk environment, use MCP or REST credentials through VS Code Secret Storage rather than committing tokens.

## Example Prompt

```text
Create a failed login dashboard by country and user agent.
Alert if failed logins exceed 100 in 5 minutes.
```

SPL Forge will generate SPL, test it, repair field mismatches, preview results, and export the dashboard/alert artifacts.

## Project Structure

```text
spl-forge/
├─ src/
│  ├─ extension.ts
│  ├─ agent/
│  ├─ splunk/
│  ├─ artifacts/
│  └─ panels/
├─ webview-ui/
├─ examples/
├─ README.md
└─ PRD.md
```

## Roadmap

- [x] Define MVP and PRD
- [ ] VS Code assistant panel
- [ ] SPL generation and explanation
- [ ] Splunk execution via MCP/REST/mock
- [ ] Self-repair loop
- [ ] Dashboard and alert export
- [ ] Marketplace-ready packaging

## Why it matters

Splunk is powerful, but building reliable SPL and production-ready artifacts takes expertise. SPL Forge makes Splunk development faster, safer, and more accessible by turning AI assistance into an executable development workflow — not just a chatbot.

---

<div align="center">

**SPL Forge** — build Splunk artifacts at the speed of intent.

</div>
