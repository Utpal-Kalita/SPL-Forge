# PRD.md — SPL Forge

**Product name:** SPL Forge  
**Tagline:** A self-debugging agentic IDE for building Splunk searches, dashboards, alerts, and apps from natural language.  
**Document type:** Product Requirements Document  
**Version:** v1.0  
**Date:** 2026-05-24  
**Primary build target:** Splunk Agentic Ops Hackathon 2026  
**Primary track:** Platform & Developer Experience  
**Secondary prize angles:** Best Use of Splunk MCP Server, Best Use of Splunk Hosted Models, Best Use of Splunk Developer Tools  

---

## 1. Executive Summary

SPL Forge is a VS Code extension and optional web dashboard that acts as an autonomous AI development partner for Splunk. A user describes what they want in plain English, and SPL Forge generates the required Splunk Processing Language (SPL), tests it against a real Splunk environment, reads execution errors, introspects available indexes/sourcetypes/fields, repairs the query, and then turns the validated query into reusable Splunk artifacts such as dashboards, alerts, reports, and app packages.

The core value is not just natural-language SPL generation. The core value is the **closed feedback loop**:

```text
User intent → Generate SPL → Execute in Splunk → Read result/error → Inspect schema → Repair → Re-run → Package artifact
```

This makes SPL Forge more than a chatbot. It behaves like a junior Splunk developer who can write, test, debug, document, and package Splunk work while keeping a human in control.

The MVP is designed to be achievable in 10 days. It will focus on one polished workflow:

> “Create a failed-login dashboard by country and user agent, and alert if failed attempts exceed a threshold.”

The MVP should demonstrate that SPL Forge can generate a query, execute it, detect a field mismatch or SPL error, fix itself using live Splunk metadata, show results, and export a basic dashboard or alert configuration.

---

## 2. Product Vision

SPL Forge should make building on Splunk feel as natural as describing the outcome you want.

Today, many developers, security analysts, and operations engineers know what they want to investigate, monitor, or visualize, but they may not know the exact SPL syntax, sourcetype names, field names, dashboard schema, or alert configuration format. SPL Forge bridges that gap.

The long-term vision is to become the **agentic development layer for Splunk**:

- A natural-language interface for creating Splunk content.
- A self-debugging SPL workbench.
- A packaging tool for dashboards, alerts, saved searches, and apps.
- A team assistant that learns from local Splunk schemas and previous successful patterns.
- A developer platform that turns reusable operational patterns into shareable templates and workflows.

In the short term, SPL Forge should win trust by doing a narrow set of things reliably. In the long term, it can become a product category: **AI-native Splunk development operations**.

---

## 3. Problem Statement

Splunk is powerful, but building high-quality Splunk artifacts requires specialized knowledge.

Users must often know:

- Which indexes exist.
- Which sourcetypes contain the relevant data.
- Which fields are available and normalized.
- How to write correct SPL.
- How to debug SPL syntax and field errors.
- How to transform results into visualizations.
- How to create saved searches and alerts.
- How to structure Splunk apps and configuration files.

This creates friction for new users and slows down experienced users.

### Current pain points

1. **SPL has a learning curve**  
   Users may know the operational question but not the exact query syntax.

2. **Data discovery is slow**  
   Users often waste time checking indexes, sourcetypes, and field names before writing useful queries.

3. **LLM-generated SPL is not trustworthy by itself**  
   A model can generate plausible SPL that fails in the real environment because the fields or sourcetypes are wrong.

4. **Dashboards and alerts require extra manual work**  
   Even after a query works, turning it into a dashboard, alert, saved search, or app package is a separate workflow.

5. **Existing assistants often stop at suggestions**  
   SPL Forge should go further: execute, inspect, repair, and package.

---

## 4. Why Now

The timing is strong because three trends are converging:

1. **Agentic AI is moving from chat to action**  
   Users now expect AI tools to operate across workflows, not only answer questions. SPL Forge should turn this expectation into a practical Splunk development workflow.

2. **Splunk is exposing AI-friendly capabilities**  
   Splunk MCP Server enables AI agents and clients to connect to Splunk data and tools through a standardized interface. Splunk AI Assistant and Hosted Models also create a strong platform story for natural-language SPL generation and AI-assisted operations.

3. **Developer tooling is shifting into the IDE**  
   VS Code is where developers already work. A Splunk-specific agent inside VS Code reduces context switching and makes the product feel practical rather than experimental.

For the hackathon, this is especially relevant because the Platform track focuses on making Splunk easier to create, extend, and automate with. SPL Forge directly targets that goal.

---

## 5. Target Users

### 5.1 Primary Users

#### Splunk App Developer

**Goal:** Build dashboards, searches, alerts, and apps faster.  
**Pain:** Knows development workflows but may lose time on SPL syntax and Splunk configuration.  
**SPL Forge value:** Generates and packages Splunk artifacts from intent.

#### Security Analyst

**Goal:** Create detection searches and dashboards for suspicious activity.  
**Pain:** Needs fast answers during investigations but may not be an SPL expert.  
**SPL Forge value:** Turns natural-language detections into validated searches and alerts.

#### SRE / DevOps Engineer

**Goal:** Monitor applications, infrastructure, deployments, and error patterns.  
**Pain:** Needs dashboards quickly, often under incident pressure.  
**SPL Forge value:** Generates operational dashboards and verifies queries against real data.

#### Splunk Admin / Platform Engineer

**Goal:** Help teams use Splunk consistently and safely.  
**Pain:** Receives repeated requests for dashboards, reports, and saved searches.  
**SPL Forge value:** Provides reusable templates, governance, and human-approved automation.

### 5.2 Secondary Users

- Hackathon judges evaluating product originality and feasibility.
- Enterprise leaders evaluating developer productivity gains.
- Splunk community builders creating reusable templates.
- New Splunk learners who need guided SPL creation.

---

## 6. Core User Story

As a Splunk user, I want to describe a dashboard, search, or alert in natural language so that SPL Forge can generate, test, repair, and export a working Splunk artifact without requiring me to manually write every SPL query or configuration file.

### Example user prompt

```text
Create a dashboard that tracks failed login attempts by country and user agent for the last 30 minutes. Add an alert if failed attempts exceed 100 in 5 minutes.
```

### Expected output

SPL Forge should produce:

1. A generated SPL query.
2. A short explanation of the query.
3. Execution result or preview.
4. Any detected issue and repair history.
5. Dashboard configuration.
6. Alert configuration.
7. Exportable Splunk app folder or zip package.

---

## 7. Goals

### 7.1 Product Goals

- Reduce the time required to create useful Splunk searches and dashboards.
- Make SPL development accessible to non-experts.
- Improve trust in AI-generated SPL by executing and repairing queries against real Splunk data.
- Provide a polished VS Code experience that feels like a real developer tool.
- Demonstrate clear Splunk platform alignment for the hackathon.

### 7.2 MVP Goals

Within 10 days, SPL Forge must:

- Run inside VS Code as an extension.
- Accept natural-language prompts.
- Generate SPL using an LLM.
- Connect to Splunk through MCP or REST fallback.
- Execute generated SPL against Splunk.
- Detect errors or empty-result problems.
- Repair at least one common failure type, such as wrong field name or sourcetype.
- Display the final SPL, result preview, and explanation.
- Export a simple dashboard or saved-search style artifact.
- Provide a demo-ready flow with sample data.

---

## 8. Non-Goals for MVP

The MVP should intentionally avoid overbuilding.

The following are not required in the first 10 days:

- Full production deployment into Splunk Cloud.
- Multi-user collaboration.
- Enterprise SSO.
- Advanced role-based access control beyond Splunk’s own permissions.
- Full Splunk app lifecycle management.
- Complete support for every dashboard format.
- Long-term memory across organizations.
- Autonomous destructive actions.
- Complex multi-agent orchestration with many independent agents.
- Visual drag-and-drop dashboard editing.
- Marketplace publishing.

The MVP must prove the core loop first: **generate → execute → debug → export**.

---

## 9. Product Principles

1. **Human-in-the-loop first**  
   The user should approve query execution, dashboard export, and any deployment step.

2. **Trust through execution**  
   SPL Forge should not claim a query works unless it has been tested or clearly marked as untested.

3. **Explain every generated artifact**  
   Users should understand what SPL Forge created and why.

4. **Safe by default**  
   Avoid destructive actions. Prefer read-only searches and export files during MVP.

5. **Schema-aware, not generic**  
   The system should use real Splunk indexes, sourcetypes, and fields whenever possible.

6. **Start narrow, polish deeply**  
   One excellent demo flow is better than five incomplete flows.

---

## 10. MVP Scope — 10 Days

### 10.1 MVP Theme

**Build one polished self-debugging Splunk development workflow inside VS Code.**

### 10.2 MVP Demo Scenario

The default demo scenario should be failed-login monitoring.

User enters:

```text
Create a failed login dashboard by country and user agent. Alert if failed logins exceed 100 in 5 minutes.
```

SPL Forge should:

1. Ask the LLM to generate a candidate SPL query.
2. Execute the SPL against Splunk.
3. Intentionally encounter or simulate one error, such as a missing field.
4. Use schema introspection to discover available fields.
5. Repair the SPL.
6. Re-run the query.
7. Show a result preview.
8. Generate dashboard and alert artifacts.
9. Export a small Splunk app folder.

### 10.3 MVP Deliverables

| Deliverable | Description | Must Have? |
|---|---|---|
| VS Code extension shell | Command palette entry and side panel | Yes |
| SPL Forge webview | Chat-like prompt interface inside VS Code | Yes |
| LLM provider | Generates SPL and repairs errors | Yes |
| Splunk connector | Executes SPL through MCP or REST fallback | Yes |
| Schema introspection | Lists indexes, sourcetypes, and fields where possible | Yes |
| Self-debug loop | Repairs query using error/result context | Yes |
| Result preview | Shows table or JSON result summary | Yes |
| Artifact export | Writes dashboard/alert/app files locally | Yes |
| README + demo script | Explains setup and value | Yes |
| Full production deploy | Deploy directly into Splunk Cloud | No |

### 10.4 MVP Success Definition

The MVP is successful if a judge can watch a 3-minute demo and clearly see:

- Natural-language prompt inside VS Code.
- Generated SPL query.
- Real or simulated Splunk execution.
- Error detection.
- Automatic repair.
- Successful final result.
- Exported dashboard or alert artifact.

---

## 11. Post-MVP Expansion

### Phase 2 — Better Developer Experience

Timeframe: 2–4 weeks after MVP

Goals:

- Add syntax-highlighted SPL editor.
- Add query history.
- Add saved prompt templates.
- Add editable generated dashboard configuration.
- Add support for multiple example use cases.
- Add stronger validation before exporting artifacts.

Deliverables:

- “Generate Search” workflow.
- “Generate Dashboard” workflow.
- “Generate Alert” workflow.
- “Explain Existing SPL” workflow.
- “Repair Current SPL File” command.

### Phase 3 — Team and Workflow Integration

Timeframe: 1–3 months

Goals:

- Git integration.
- Pull request generation for Splunk app changes.
- Team templates.
- Audit logs.
- CI validation for generated SPL and app configs.
- Integration with Jira, Slack, or ServiceNow for handoff.

Deliverables:

- Generated artifact diffs.
- Git branch creation.
- Team-level prompt library.
- Organization-level safety policies.

### Phase 4 — Agentic Splunk Builder Platform

Timeframe: 6–12 months

Goals:

- Plugin ecosystem.
- Marketplace of Splunk build recipes.
- Enterprise deployment and governance.
- Multi-agent build/review/test loop.
- Hosted SaaS backend for teams.

Deliverables:

- SPL Forge template marketplace.
- Enterprise admin console.
- Multiple model provider options.
- Splunkbase-ready app publishing pipeline.

---

## 12. Functional Requirements

### FR1 — VS Code Command Registration

**Requirement:** SPL Forge must register commands in VS Code.

Minimum commands:

- `SPL Forge: Open Assistant`
- `SPL Forge: Generate SPL from Prompt`
- `SPL Forge: Run Current SPL`
- `SPL Forge: Repair Current SPL`
- `SPL Forge: Export Splunk App`
- `SPL Forge: Configure Connection`

**Acceptance criteria:**

- Commands appear in the VS Code Command Palette.
- `Open Assistant` opens the SPL Forge side panel or webview panel.
- Commands should not fail silently; errors must be shown in UI or output logs.

---

### FR2 — Prompt Input Interface

**Requirement:** Users must be able to type natural-language instructions.

The interface should include:

- Text input box.
- Submit button.
- Prompt examples.
- Loading state.
- Error state.
- Run history for current session.

**Acceptance criteria:**

- User can enter a prompt and submit it.
- The extension receives the prompt and starts an agent run.
- User can see the generated SPL and agent steps.

---

### FR3 — LLM-Powered SPL Generation

**Requirement:** SPL Forge must convert user intent into a candidate SPL query.

The LLM should receive:

- User prompt.
- Known index/sourcetype metadata.
- Available field metadata if already known.
- Safety rules.
- Output schema.

Expected LLM output:

```json
{
  "intent_summary": "Track failed login attempts by country and user agent",
  "spl": "index=security sourcetype=auth action=failure | stats count by src_ip, user_agent",
  "time_range": "last 30 minutes",
  "visualization_hint": "bar_chart",
  "assumptions": ["Assumes failed login events use action=failure"]
}
```

**Acceptance criteria:**

- Output is parseable JSON.
- SPL is displayed to the user.
- Invalid JSON is handled with a repair or retry step.

---

### FR4 — Splunk Connection Management

**Requirement:** User must be able to configure Splunk connection details.

Supported MVP connection modes:

1. **MCP mode** for Splunk MCP Server / MCP Gateway.
2. **REST fallback mode** for direct Splunk management API access.
3. **Mock mode** for demo reliability if a live environment is unavailable.

Configuration fields:

- Splunk base URL.
- Splunk management port, commonly `8089` for local Enterprise development.
- Username/token or bearer token.
- MCP endpoint URL.
- MCP headers.
- Default index.
- Default earliest/latest time range.

**Acceptance criteria:**

- Settings can be saved through VS Code settings or secret storage.
- Secrets are not stored in plain text files.
- User can test connection.
- Failure messages are understandable.

---

### FR5 — Schema Introspection

**Requirement:** SPL Forge must discover Splunk environment context before or during generation.

Minimum metadata:

- Index names.
- Sourcetypes.
- Field names for a chosen index/sourcetype.
- Sample event fields if available.

MVP approach:

- Use MCP tools if available.
- Use REST fallback where possible.
- Use a mock schema file for deterministic hackathon demo if needed.

Example mock schema file:

```json
{
  "indexes": ["security", "main", "web"],
  "sourcetypes": ["auth", "access_combined", "syslog"],
  "fields": {
    "auth": ["user", "src_ip", "action", "status", "user_agent", "country"]
  }
}
```

**Acceptance criteria:**

- User can click “Inspect Splunk Environment.”
- UI displays discovered indexes, sourcetypes, and fields.
- The generation prompt includes schema context.

---

### FR6 — SPL Execution

**Requirement:** SPL Forge must run generated SPL against Splunk.

Execution modes:

- Real Splunk execution through MCP.
- REST fallback execution.
- Mock execution for demo mode.

Execution result should include:

- Status: success/error/timeout.
- Result rows.
- Field list.
- Raw error message.
- Runtime duration.
- Search job ID if available.

**Acceptance criteria:**

- User can run generated SPL.
- Results are displayed in a table or JSON view.
- Errors are captured and passed to the repair loop.

---

### FR7 — Self-Debugging Repair Loop

**Requirement:** If SPL execution fails, SPL Forge must attempt to repair the query.

Repair loop input:

- Original user intent.
- Failed SPL.
- Splunk error message.
- Available schema metadata.
- Previous attempts.

Repair loop output:

- New SPL.
- Explanation of fix.
- Confidence level.

Repair policy:

- Maximum 2 repair attempts for MVP.
- Ask for user approval before running a repaired query unless demo mode auto-run is enabled.
- Stop if query becomes unsafe, too broad, or repeatedly fails.

**Acceptance criteria:**

- A known broken query can be repaired in demo.
- Repair history is visible.
- User can compare original and repaired SPL.

---

### FR8 — Result Preview

**Requirement:** Successful search results must be shown in a readable preview.

MVP preview formats:

- Table preview.
- JSON preview.
- Basic chart hint, such as bar/table/single value.

**Acceptance criteria:**

- The user can see at least the first 20 result rows.
- Field names are visible.
- Empty results are treated as a possible quality issue, not only success.

---

### FR9 — Dashboard Generation

**Requirement:** SPL Forge must generate a simple dashboard artifact from a validated SPL query.

MVP dashboard output:

- A JSON or XML-like dashboard file.
- Title.
- Description.
- One panel.
- Associated SPL query.
- Visualization type.

MVP file path:

```text
splunk-app-template/default/data/ui/views/generated_dashboard.xml
```

or

```text
exports/dashboard.generated.json
```

**Acceptance criteria:**

- User can click “Generate Dashboard.”
- A dashboard file is created locally.
- The file contains the validated SPL.

---

### FR10 — Alert Generation

**Requirement:** SPL Forge must generate an alert configuration when user intent includes a threshold or schedule.

MVP alert output:

- Name.
- Description.
- SPL query.
- Cron schedule or time window.
- Threshold condition.
- Severity.

Example conceptual output:

```ini
[Failed Login Spike Alert]
search = index=security sourcetype=auth action=failure earliest=-5m | stats count
cron_schedule = */5 * * * *
alert_type = number of events
alert_comparator = greater than
alert_threshold = 100
```

**Acceptance criteria:**

- Alert config is generated only after query validation.
- User can inspect and edit generated alert before export.

---

### FR11 — Splunk App Export

**Requirement:** SPL Forge must export generated artifacts into a local app-like folder structure.

MVP export structure:

```text
spl-forge-generated-app/
  app.conf
  README.md
  default/
    savedsearches.conf
    data/
      ui/
        views/
          generated_dashboard.xml
  metadata/
    default.meta
```

**Acceptance criteria:**

- User can export a folder or zip.
- Export includes the final SPL and generated dashboard/alert files.
- README explains how to review/import manually.

---

### FR12 — Agent Run Log

**Requirement:** Every generation run should create an auditable local log.

Log fields:

- Run ID.
- Timestamp.
- User prompt.
- Generated SPL.
- Execution status.
- Error message if any.
- Repair attempts.
- Final artifact paths.

**Acceptance criteria:**

- Log is visible in UI.
- Log can be saved as JSON for demo proof.
- Secrets and tokens are never logged.

---

## 13. User Experience Requirements

### 13.1 Primary UX Flow

```text
Open VS Code → Open SPL Forge → Configure Splunk → Enter prompt → Generate SPL → Run → Repair if needed → Preview result → Generate artifact → Export app
```

### 13.2 UI Sections

The MVP webview should have five areas:

1. **Prompt panel**  
   Natural-language input and example prompts.

2. **Agent activity timeline**  
   Steps like “Generating SPL,” “Inspecting fields,” “Running search,” “Repairing query.”

3. **SPL editor/output**  
   Generated SPL with copy and run buttons.

4. **Results preview**  
   Table or JSON preview.

5. **Artifact panel**  
   Dashboard/alert export actions.

### 13.3 UX Copy Guidelines

Use simple language. Avoid showing only raw stack traces.

Bad:

```text
AxiosError: Request failed with status code 401
```

Better:

```text
SPL Forge could not connect to Splunk. Your token may be expired or missing required permissions.
```

---

## 14. Technical Architecture

### 14.1 Simple Explanation

SPL Forge has four main parts:

1. **VS Code Extension UI**  
   The user interface where prompts, generated SPL, results, and exports are shown.

2. **Agent Orchestrator**  
   The brain that decides what to do next: generate, run, inspect, repair, or export.

3. **Splunk Connector**  
   The bridge that talks to Splunk using MCP or REST.

4. **Artifact Generator**  
   The module that turns validated SPL into dashboards, alerts, saved searches, and app files.

### 14.2 Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│                         VS Code                             │
│                                                             │
│  ┌──────────────────────┐        ┌──────────────────────┐   │
│  │ SPL Forge Webview UI │◀──────▶│ Extension Host       │   │
│  │ Prompt / Logs / UI   │        │ Commands / Secrets   │   │
│  └──────────────────────┘        └──────────┬───────────┘   │
│                                             │               │
└─────────────────────────────────────────────│───────────────┘
                                              │
                                              ▼
                         ┌───────────────────────────────┐
                         │ Agent Orchestrator             │
                         │ generate → run → repair → pack │
                         └───────┬─────────────┬─────────┘
                                 │             │
                                 ▼             ▼
                 ┌────────────────────┐   ┌────────────────────┐
                 │ LLM Provider        │   │ Splunk Connector    │
                 │ Hosted Model/OpenAI │   │ MCP / REST / Mock   │
                 └────────────────────┘   └─────────┬──────────┘
                                                     │
                                                     ▼
                                      ┌─────────────────────────┐
                                      │ Splunk Enterprise/Cloud │
                                      │ Indexes/Search/Fields   │
                                      └─────────────────────────┘
```

### 14.3 Component Responsibilities

| Component | Responsibility |
|---|---|
| `extension.ts` | Activate extension, register commands, initialize services |
| `AssistantPanel` | Manage VS Code webview UI |
| `AgentOrchestrator` | Control generation, execution, repair, export workflow |
| `LLMProvider` | Call model provider and enforce JSON output |
| `SplunkConnector` | Run searches and fetch metadata |
| `MCPConnector` | Talk to Splunk MCP Server / Gateway |
| `RESTConnector` | Fallback connector for Splunk REST API |
| `MockConnector` | Deterministic demo connector |
| `SchemaService` | Cache indexes, sourcetypes, fields, samples |
| `ArtifactGenerator` | Generate dashboards, alerts, saved searches, app folder |
| `RunLogger` | Store local audit trail of each agent run |

---

## 15. Recommended Tech Stack

### 15.1 MVP Stack

| Layer | Technology | Reason |
|---|---|---|
| IDE extension | VS Code Extension API | Native developer workflow |
| Language | TypeScript | Best fit for VS Code extensions |
| Runtime | Node.js 20+ | Stable extension ecosystem |
| UI | VS Code Webview + React + Vite | Fast polished UI inside VS Code |
| Validation | Zod | Validate LLM JSON outputs and configs |
| HTTP client | Axios or native fetch | API calls to model/Splunk services |
| Zip export | JSZip | Export app packages |
| Testing | Vitest | Fast TS unit tests |
| Linting | ESLint | Code quality |
| Secrets | VS Code SecretStorage | Avoid token leakage |
| Splunk access | MCP first, REST fallback, mock mode | Reliable demo + real integration path |
| AI model | Splunk Hosted Models if available; otherwise OpenAI/Anthropic/local model adapter | Keeps provider flexible |

### 15.2 Optional Post-MVP Stack

| Need | Technology Option |
|---|---|
| Backend service | FastAPI or Node.js server |
| Team storage | Postgres |
| Vector memory | pgvector, Qdrant, or Chroma |
| Background jobs | BullMQ / Redis |
| Enterprise auth | SSO/SAML/OIDC |
| Monitoring | Splunk itself |
| Marketplace | Splunkbase + VS Code Marketplace |

---

## 16. VS Code Extension Setup

### 16.1 Prerequisites

Install:

- VS Code.
- Node.js 20 or later.
- npm.
- Git.
- A Splunk Enterprise, Splunk Cloud, or mock Splunk environment.
- Optional: existing Splunk VS Code extension for reference and local Splunk development help.

### 16.2 Scaffold the Extension

Use the official VS Code extension generator:

```bash
npx --package yo --package generator-code -- yo code
```

Recommended generator answers:

```text
? What type of extension do you want to create? New Extension (TypeScript)
? What's the name of your extension? SPL Forge
? What's the identifier of your extension? spl-forge
? What's the description? Self-debugging agentic IDE for Splunk development
? Initialize a git repository? Yes
? Which bundler to use? esbuild or unbundled for MVP
? Which package manager to use? npm
```

Then:

```bash
cd spl-forge
npm install
code .
```

Press `F5` in VS Code to launch an Extension Development Host.

### 16.3 Add Core Dependencies

```bash
npm install axios zod uuid jszip dotenv
npm install -D vitest eslint @types/node typescript
```

For a React webview UI:

```bash
npm create vite@latest webview-ui -- --template react-ts
cd webview-ui
npm install
npm install zod
```

### 16.4 Suggested Repository Structure

```text
spl-forge/
  README.md
  PRD.md
  package.json
  tsconfig.json
  .vscode/
    launch.json
    tasks.json
  src/
    extension.ts
    commands/
      openAssistant.ts
      generateSpl.ts
      runSpl.ts
      repairSpl.ts
      exportApp.ts
      configureConnection.ts
    panels/
      AssistantPanel.ts
      getWebviewHtml.ts
    agent/
      AgentOrchestrator.ts
      prompts.ts
      types.ts
      safety.ts
    providers/
      LLMProvider.ts
      OpenAIProvider.ts
      SplunkHostedModelProvider.ts
    splunk/
      SplunkConnector.ts
      MCPConnector.ts
      RESTConnector.ts
      MockConnector.ts
      SchemaService.ts
    artifacts/
      DashboardGenerator.ts
      AlertGenerator.ts
      AppPackager.ts
    storage/
      SecretStore.ts
      RunLogger.ts
    utils/
      jsonRepair.ts
      errors.ts
    test/
      agent.test.ts
      artifact.test.ts
      mockConnector.test.ts
  webview-ui/
    src/
      App.tsx
      components/
        PromptBox.tsx
        AgentTimeline.tsx
        SplPreview.tsx
        ResultTable.tsx
        ArtifactPanel.tsx
  sample-data/
    auth_events.csv
    mock-schema.json
  splunk-app-template/
    app.conf
    default/
      savedsearches.conf
      data/
        ui/
          views/
            dashboard.xml
    metadata/
      default.meta
```

### 16.5 package.json Contribution Points

Example MVP contribution configuration:

```json
{
  "activationEvents": [
    "onCommand:splForge.openAssistant",
    "onCommand:splForge.generateSpl",
    "onCommand:splForge.runCurrentSpl",
    "onCommand:splForge.repairCurrentSpl",
    "onCommand:splForge.exportApp"
  ],
  "contributes": {
    "commands": [
      {
        "command": "splForge.openAssistant",
        "title": "SPL Forge: Open Assistant"
      },
      {
        "command": "splForge.generateSpl",
        "title": "SPL Forge: Generate SPL from Prompt"
      },
      {
        "command": "splForge.runCurrentSpl",
        "title": "SPL Forge: Run Current SPL"
      },
      {
        "command": "splForge.repairCurrentSpl",
        "title": "SPL Forge: Repair Current SPL"
      },
      {
        "command": "splForge.exportApp",
        "title": "SPL Forge: Export Splunk App"
      }
    ],
    "configuration": {
      "title": "SPL Forge",
      "properties": {
        "splForge.connectionMode": {
          "type": "string",
          "enum": ["mcp", "rest", "mock"],
          "default": "mock",
          "description": "Connection mode for Splunk integration."
        },
        "splForge.splunkBaseUrl": {
          "type": "string",
          "default": "https://localhost:8089",
          "description": "Splunk management API base URL for REST fallback mode."
        },
        "splForge.mcpEndpoint": {
          "type": "string",
          "default": "",
          "description": "Splunk MCP Gateway endpoint."
        },
        "splForge.modelProvider": {
          "type": "string",
          "enum": ["splunk-hosted", "openai", "anthropic", "local", "mock"],
          "default": "mock",
          "description": "Model provider used by SPL Forge."
        },
        "splForge.maxRepairAttempts": {
          "type": "number",
          "default": 2,
          "description": "Maximum number of automatic SPL repair attempts."
        }
      }
    }
  }
}
```

### 16.6 Extension Activation Skeleton

```ts
import * as vscode from "vscode";
import { AssistantPanel } from "./panels/AssistantPanel";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("splForge.openAssistant", () => {
      AssistantPanel.createOrShow(context.extensionUri, context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("splForge.generateSpl", async () => {
      vscode.window.showInformationMessage("SPL Forge generation started.");
    })
  );
}

export function deactivate() {}
```

---

## 17. Splunk Setup Direction

### 17.1 Development Options

SPL Forge should support three development modes:

#### Option A — Mock Mode

Best for first 2–3 days and demo fallback.

- No live Splunk required.
- Uses `sample-data/mock-schema.json`.
- Simulates success/error responses.
- Allows deterministic demo.

#### Option B — Local Splunk Enterprise / Trial

Best for real execution testing.

- Run Splunk locally or in a VM/container.
- Import sample auth logs.
- Configure a development token/user.
- Use REST fallback mode.

#### Option C — Splunk Cloud + MCP

Best for hackathon alignment.

- Configure Splunk MCP Server or Gateway.
- Store MCP endpoint and headers securely.
- Use MCP tools for search execution and schema discovery.

### 17.2 Sample Data Plan

For MVP reliability, include sample auth events.

Example fields:

```csv
time,user,src_ip,country,user_agent,action,status,app
2026-05-24T10:00:00Z,alice,203.0.113.10,IN,Chrome,failure,401,login
2026-05-24T10:01:00Z,bob,198.51.100.20,US,Firefox,failure,401,login
2026-05-24T10:02:00Z,alice,203.0.113.10,IN,Chrome,success,200,login
```

Recommended Splunk metadata:

```text
index=security
sourcetype=auth
fields=user, src_ip, country, user_agent, action, status, app
```

### 17.3 MVP Query Examples

Successful target query:

```spl
index=security sourcetype=auth action=failure earliest=-30m
| stats count by country, user_agent
| sort - count
```

Intentional broken query for demo repair:

```spl
index=security sourcetype=auth result=failed earliest=-30m
| stats count by geo, browser
| sort - count
```

Repair should map:

- `result=failed` → `action=failure`
- `geo` → `country`
- `browser` → `user_agent`

Final repaired query:

```spl
index=security sourcetype=auth action=failure earliest=-30m
| stats count by country, user_agent
| sort - count
```

---

## 18. MCP Integration Direction

### 18.1 MCP Role in SPL Forge

MCP should be treated as the preferred live integration layer.

SPL Forge should use MCP for:

- Listing indexes.
- Listing sourcetypes.
- Getting fields or sample events.
- Running SPL searches.
- Reading search results.
- Creating or managing saved searches where available.

Because MCP tool names may differ by Splunk version or environment, SPL Forge should use an adapter interface instead of hardcoding business logic around specific tool names.

### 18.2 MCP Adapter Interface

```ts
export interface SplunkConnector {
  testConnection(): Promise<ConnectionStatus>;
  listIndexes(): Promise<string[]>;
  listSourcetypes(index?: string): Promise<string[]>;
  listFields(params: FieldParams): Promise<string[]>;
  runSearch(query: string, options: SearchOptions): Promise<SearchResult>;
  exportArtifact?(artifact: SplunkArtifact): Promise<ExportResult>;
}
```

### 18.3 MCP Client Configuration Concept

The user should configure:

```json
{
  "endpoint": "https://region-<SCS_REGION>.api.scs.splunk.com/system/mcp-gateway/v1/",
  "headers": {
    "Authorization": "Bearer <JWT_TOKEN>",
    "splunk_tenant": "<SPLUNK_TENANT_NAME>"
  }
}
```

For Splunk Observability scenarios, additional headers may be required, such as observability access token and realm.

### 18.4 REST Fallback

REST fallback is useful because:

- It is simpler for local development.
- The existing Splunk VS Code extension already uses Splunk REST API concepts for saved searches and reports.
- It reduces risk if MCP access is delayed.

The fallback connector should implement the same `SplunkConnector` interface so the rest of the app does not care which mode is active.

---

## 19. AI / Agent Design

### 19.1 Agent Responsibilities

The MVP should use one orchestrator with multiple internal steps, not many complex agents.

Steps:

1. Interpret user intent.
2. Fetch schema context.
3. Generate candidate SPL.
4. Validate LLM output.
5. Ask user to run or auto-run in demo mode.
6. Execute query.
7. Detect success, error, or empty result.
8. Repair if needed.
9. Generate artifact.
10. Produce final explanation.

### 19.2 Agent State Model

```ts
export type AgentRunStatus =
  | "idle"
  | "generating"
  | "executing"
  | "repairing"
  | "succeeded"
  | "failed"
  | "exported";

export interface AgentRun {
  id: string;
  prompt: string;
  status: AgentRunStatus;
  schemaContext?: SchemaContext;
  attempts: SPLAttempt[];
  finalSpl?: string;
  results?: SearchResult;
  artifacts?: SplunkArtifact[];
  createdAt: string;
}

export interface SPLAttempt {
  attemptNumber: number;
  spl: string;
  explanation: string;
  execution?: SearchResult;
  repairReason?: string;
}
```

### 19.3 Generation Prompt Template

System instruction:

```text
You are SPL Forge, an expert Splunk development assistant. Generate safe, read-only SPL unless the user explicitly asks for configuration artifacts. Use the provided schema context. Do not invent indexes or fields if schema context is available. Return valid JSON only.
```

User/context payload:

```json
{
  "user_intent": "Create a failed login dashboard by country and user agent",
  "schema_context": {
    "indexes": ["security"],
    "sourcetypes": ["auth"],
    "fields": ["user", "src_ip", "country", "user_agent", "action", "status"]
  },
  "output_schema": {
    "spl": "string",
    "explanation": "string",
    "assumptions": "string[]",
    "visualization_hint": "table|bar|line|single_value"
  }
}
```

### 19.4 Repair Prompt Template

```text
The previous SPL failed or produced poor results. Repair it using the error message and available schema. Do not change the user's intent. Prefer fields that exist in schema_context. Return valid JSON only.
```

Payload:

```json
{
  "original_intent": "Create a failed login dashboard by country and user agent",
  "failed_spl": "index=security sourcetype=auth result=failed | stats count by geo, browser",
  "splunk_error": "Unknown fields: geo, browser",
  "schema_context": {
    "fields": ["country", "user_agent", "action", "status"]
  }
}
```

Expected repair output:

```json
{
  "spl": "index=security sourcetype=auth action=failure earliest=-30m | stats count by country, user_agent | sort - count",
  "repair_summary": "Replaced result=failed with action=failure and mapped geo/browser to country/user_agent based on available fields.",
  "confidence": 0.86
}
```

### 19.5 Agent Pseudocode

```ts
async function runAgent(prompt: string) {
  const schema = await schemaService.getRelevantSchema(prompt);

  let candidate = await llm.generateSpl({ prompt, schema });

  for (let attempt = 1; attempt <= maxRepairAttempts + 1; attempt++) {
    const result = await splunk.runSearch(candidate.spl, { earliest: "-30m", latest: "now" });

    logAttempt(candidate, result);

    if (result.status === "success" && result.rows.length > 0) {
      const artifacts = await artifactGenerator.generate({ prompt, candidate, result });
      return { status: "succeeded", candidate, result, artifacts };
    }

    if (attempt > maxRepairAttempts) {
      return { status: "failed", candidate, result };
    }

    const expandedSchema = await schemaService.expandFromFailure(result.error, candidate.spl);
    candidate = await llm.repairSpl({ prompt, failedSpl: candidate.spl, result, schema: expandedSchema });
  }
}
```

---

## 20. Artifact Generation Requirements

### 20.1 Dashboard Artifact

Dashboard generator input:

```ts
interface DashboardInput {
  title: string;
  description: string;
  spl: string;
  visualizationHint: "table" | "bar" | "line" | "single_value";
  fields: string[];
}
```

MVP output:

- One dashboard file.
- One panel.
- Valid query embedded.
- Human-readable title and description.

### 20.2 Alert Artifact

Alert generator input:

```ts
interface AlertInput {
  title: string;
  spl: string;
  threshold: number;
  comparator: "greater_than" | "less_than" | "equals";
  window: string;
  schedule: string;
}
```

MVP output:

- Saved search style config.
- Threshold condition.
- Schedule.
- Description.

### 20.3 App Package

Package generator should produce:

```text
spl-forge-generated-app/
  README.md
  app.conf
  default/savedsearches.conf
  default/data/ui/views/generated_dashboard.xml
  metadata/default.meta
```

The README should include:

- Prompt used.
- Generated SPL.
- How to review the files.
- How to import manually.
- Safety note: review before production use.

---

## 21. Data and Configuration Model

### 21.1 User Settings

```ts
interface SPLForgeSettings {
  connectionMode: "mcp" | "rest" | "mock";
  splunkBaseUrl?: string;
  mcpEndpoint?: string;
  defaultIndex?: string;
  defaultEarliest?: string;
  defaultLatest?: string;
  modelProvider: "splunk-hosted" | "openai" | "anthropic" | "local" | "mock";
  maxRepairAttempts: number;
  demoMode: boolean;
}
```

### 21.2 Secrets

Store secrets using VS Code SecretStorage:

- Splunk token.
- MCP bearer token.
- OpenAI/Anthropic API key if used.
- Splunk username/password only if token flow is unavailable.

Never store secrets in:

- `settings.json`
- run logs
- exported artifacts
- screenshots
- Git repository

---

## 22. Security Requirements

### 22.1 MVP Security Rules

- Default to read-only searches.
- Require approval before export or deploy.
- Hide secrets from UI logs.
- Redact tokens from errors.
- Limit search time range by default.
- Limit result rows shown in UI.
- Block suspicious user prompts that ask for credential exfiltration, destructive API calls, or bypassing permissions.

### 22.2 Query Safety Checks

Before execution, check:

- Does SPL use broad `index=*` without time range?
- Does it include commands that may be expensive or risky?
- Does it include external calls or suspicious macros?
- Does it have `earliest`/`latest` bounds?

MVP safety response:

```text
This query may be expensive because it searches all indexes without a time range. SPL Forge added earliest=-30m for safe execution.
```

### 22.3 Enterprise Future Security

Post-MVP security should include:

- RBAC mapping.
- Approval workflow.
- Organization policies.
- Audit trail export.
- Prompt redaction.
- Model provider allowlist.
- On-prem/local model support.

---

## 23. Performance Requirements

### MVP Targets

| Metric | Target |
|---|---|
| Extension startup | < 2 seconds after activation |
| Prompt to first SPL | < 10 seconds with cloud LLM |
| Search execution | Depends on Splunk, but UI should stream status |
| Repair loop | <= 2 attempts |
| Result preview | First 20 rows rendered smoothly |
| Export | < 5 seconds for MVP app folder |

### Post-MVP Targets

- Stream agent activity in real time.
- Cache schema metadata for faster prompts.
- Cancel long-running searches.
- Support background execution with progress indicator.

---

## 24. Reliability Requirements

The demo must be resilient even if a live Splunk connection fails.

Required reliability safeguards:

- Mock mode with deterministic responses.
- Clear connection test button.
- Graceful fallback from MCP to REST where configured.
- Human-readable error messages.
- Local sample schema and sample data.
- Export should work even if live deployment does not.

---

## 25. Testing Plan

### 25.1 Unit Tests

Test modules:

- Prompt builders.
- JSON output validation.
- Agent loop state transitions.
- Mock connector responses.
- Artifact generator output.
- Secret redaction.

### 25.2 Integration Tests

Test flows:

1. Generate SPL from prompt.
2. Execute successful mock search.
3. Execute failed mock search and repair.
4. Generate dashboard artifact.
5. Export app folder.

### 25.3 Manual Demo Tests

Before recording demo, verify:

- VS Code extension launches with F5.
- SPL Forge panel opens.
- Prompt input works.
- Agent activity timeline updates.
- Broken query is repaired.
- Final result is shown.
- Dashboard/alert export works.
- README and architecture diagram are present.

### 25.4 Test Prompts

Prompt 1:

```text
Create a dashboard showing failed login attempts by country and user agent in the last 30 minutes.
```

Prompt 2:

```text
Create an alert if failed login attempts exceed 100 in 5 minutes.
```

Prompt 3:

```text
Show top source IPs causing failed authentication events.
```

Prompt 4:

```text
Explain this SPL and suggest a better visualization.
```

---

## 26. 10-Day Build Plan

### Day 1 — Project Setup

Goals:

- Scaffold VS Code extension.
- Set up repo structure.
- Add command palette commands.
- Add basic webview panel.

Deliverables:

- Extension opens in Extension Development Host.
- `SPL Forge: Open Assistant` command works.
- Empty assistant UI visible.

### Day 2 — UI + Mock Agent

Goals:

- Build prompt input UI.
- Build agent timeline UI.
- Add mock LLM provider.
- Add mock Splunk connector.

Deliverables:

- Prompt generates a fake SPL.
- Timeline shows generate/run/complete steps.

### Day 3 — LLM Integration

Goals:

- Add real model provider adapter.
- Add structured JSON output schema.
- Add validation with Zod.

Deliverables:

- Prompt returns parseable SPL JSON.
- Invalid model output is handled.

### Day 4 — Splunk Connector

Goals:

- Implement REST fallback connector or MCP connector skeleton.
- Add connection settings.
- Add test connection command.

Deliverables:

- Mock and one real connector path compile.
- User can select mode.

### Day 5 — Search Execution

Goals:

- Execute SPL through connector.
- Display result rows.
- Capture errors.

Deliverables:

- Generated SPL can run in mock mode and/or live Splunk.
- Result preview table works.

### Day 6 — Repair Loop

Goals:

- Implement repair prompt.
- Implement max attempts.
- Show repair history.

Deliverables:

- Broken query gets repaired using schema context.
- UI shows before/after SPL.

### Day 7 — Schema Introspection

Goals:

- Add schema service.
- Load mock schema and/or discover live schema.
- Inject schema into prompt.

Deliverables:

- UI shows indexes/sourcetypes/fields.
- Generated queries use available fields.

### Day 8 — Artifact Export

Goals:

- Generate dashboard artifact.
- Generate alert artifact.
- Export app folder/zip.

Deliverables:

- Export creates local files.
- README generated with prompt and final SPL.

### Day 9 — Polish + Demo Reliability

Goals:

- Improve UI copy.
- Add loading/error states.
- Add sample prompts.
- Add architecture diagram.
- Fix bugs.

Deliverables:

- Demo flow works 3 times in a row.
- README setup instructions complete.

### Day 10 — Submission Assets

Goals:

- Record demo video.
- Finalize PRD, README, roadmap, architecture.
- Prepare Devpost submission text.

Deliverables:

- Working repo.
- Demo video script.
- Screenshots.
- Architecture diagram.
- Final package.

---

## 27. Acceptance Criteria for Hackathon MVP

The project is ready to submit when:

- [ ] VS Code extension runs locally.
- [ ] Prompt UI accepts natural language.
- [ ] SPL generation works.
- [ ] Query execution works in at least mock mode and preferably live mode.
- [ ] One broken SPL example is automatically repaired.
- [ ] Schema context is shown or simulated.
- [ ] Result preview is visible.
- [ ] Dashboard or alert artifact is generated.
- [ ] Local Splunk app folder or zip is exported.
- [ ] README explains setup clearly.
- [ ] Architecture diagram is included.
- [ ] Demo video shows end-to-end value.

---

## 28. Success Metrics

### MVP Metrics

| Metric | Target |
|---|---|
| Demo workflow completion | 100% in mock mode |
| SPL repair attempts | Query fixed within 2 attempts |
| Time from prompt to final SPL | Under 60 seconds in demo |
| Export success | App folder generated every time |
| Number of polished use cases | 1 primary + 2 optional prompts |
| Setup clarity | New user can run extension from README |

### Post-MVP Metrics

| Metric | Target |
|---|---|
| First-run SPL success rate | 60%+ initially, 80%+ with schema context |
| Query repair success rate | 70%+ for common field/syntax errors |
| Dashboard creation time | Reduce from hours to minutes |
| Active users | 100 beta users in first 3 months |
| Community engagement | GitHub stars, issues, templates, forks |
| Enterprise interest | 5+ discovery calls or pilots |

---

## 29. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| MCP access is delayed | Live integration blocked | Build REST fallback and mock mode |
| LLM generates invalid JSON | Agent breaks | Use Zod validation and retry prompt |
| Generated SPL is wrong | Trust issue | Always execute and show repair loop |
| Scope is too broad | Demo unfinished | Focus on one polished workflow |
| Splunk setup takes too long | Lost build time | Use sample data and mock connector early |
| Dashboard format complexity | Export fails | Generate simple dashboard or JSON first |
| Security concerns | Judges distrust automation | Human approval, read-only default, audit logs |
| UI takes too much time | Weak demo | Use simple webview with clear timeline |

---

## 30. Open Questions

1. Will the hackathon environment provide Splunk Hosted Models access directly?
2. Which MCP tools are available in the target Splunk MCP Server version?
3. Should MVP prioritize MCP mode or REST fallback for live demo reliability?
4. Which dashboard format should be primary: Dashboard Studio JSON or classic XML?
5. Should exported artifacts be import-ready or review-first files?
6. Will VS Code marketplace packaging be required, or is local extension demo enough?
7. Which model provider will be safest and cheapest for the demo?

---

## 31. Future Product Ideas

### 31.1 Explain Existing SPL

User highlights SPL and asks:

```text
Explain what this query does and whether it can be optimized.
```

SPL Forge returns explanation, performance risks, and a safer optimized version.

### 31.2 Convert Search to Dashboard

User selects working SPL and asks:

```text
Turn this into a dashboard with three useful panels.
```

### 31.3 Generate Detection-as-Code

Security teams can create detections, alert thresholds, and documentation from plain English.

### 31.4 PR Generator

SPL Forge creates a Git branch, commits generated app files, and opens a pull request.

### 31.5 Splunk App Reviewer

SPL Forge reviews existing Splunk apps for broken searches, missing fields, inefficient SPL, and bad configuration.

### 31.6 Shared Template Marketplace

Community users publish reusable build recipes:

- Failed login dashboard.
- Kubernetes error dashboard.
- API latency monitor.
- Suspicious IP investigation workflow.
- Cloud cost anomaly dashboard.

### 31.7 Multi-Agent Review Loop

Future version can use separate agents:

- Builder Agent writes SPL.
- Validator Agent runs and checks results.
- Security Agent reviews safety.
- UX Agent creates dashboard layout.
- Packager Agent exports final app.

---

## 32. Monetization Direction

### 32.1 Open-Core Model

Free:

- Local VS Code extension.
- Basic SPL generation.
- Mock/demo mode.
- Simple export.

Paid:

- Team templates.
- Enterprise audit logs.
- Policy controls.
- Advanced connectors.
- Shared workspace.
- Hosted agent backend.

### 32.2 Enterprise Add-On

Sell to organizations with large Splunk deployments.

Value proposition:

- Reduce dashboard and alert creation time.
- Improve consistency across teams.
- Help non-experts build safely.
- Reduce repetitive requests to Splunk admins.

### 32.3 Services and Templates

Offer:

- Custom Splunk dashboard templates.
- Detection engineering packs.
- Onboarding and training.
- Custom model/prompt tuning.

---

## 33. Demo Video Script

### 0:00–0:20 — Problem

Show VS Code and Splunk. Narration:

```text
Building Splunk dashboards and alerts requires knowing SPL, fields, sourcetypes, and configuration formats. SPL Forge turns that process into an agentic workflow inside VS Code.
```

### 0:20–0:50 — Prompt

Type:

```text
Create a failed login dashboard by country and user agent. Alert if failed attempts exceed 100 in 5 minutes.
```

Show generated SPL.

### 0:50–1:20 — Execution and Failure

Run the query. Show error or bad field detection.

```text
SPL Forge found that geo and browser do not exist in this Splunk dataset.
```

### 1:20–1:50 — Self Repair

Show schema introspection and repaired SPL.

```text
It mapped geo to country and browser to user_agent using live field metadata.
```

### 1:50–2:20 — Result Preview

Show table/chart preview.

### 2:20–2:45 — Export

Click “Export Splunk App.” Show generated files.

### 2:45–3:00 — Impact

```text
SPL Forge does not just generate SPL. It tests, debugs, explains, and packages Splunk artifacts. What used to take hours now takes minutes.
```

---

## 34. Investor-Friendly Summary

SPL Forge is a productivity layer for one of the most important enterprise data platforms. Its wedge is simple: help users create Splunk content faster. Its moat grows from environment-specific schema awareness, repair history, templates, team workflows, and trust controls.

The MVP is narrow enough to build quickly, but the product can expand into a broader platform for agentic operations development. It can start as a VS Code extension, grow into an enterprise developer tool, and eventually become a marketplace for reusable Splunk automation workflows.

---

## 35. Source Notes

This PRD is based on the SPL Forge concept: an AI-native Splunk development IDE that generates SPL, dashboard XML, alert configuration, uses Splunk MCP Server for introspection/execution, uses hosted models for generation, and uses an agent loop for debugging. It is also aligned with the Splunk Agentic Ops Hackathon platform track, which emphasizes developer and platform experiences that make Splunk easier to create, extend, and automate with.

Useful reference areas for builders:

- VS Code Extension API: extension scaffolding, commands, webviews, and Extension Development Host.
- Splunk MCP Server / MCP Gateway: MCP client configuration with endpoint, tokens, and headers.
- Splunk VS Code Extension: existing pattern for Splunk development, .conf support, saved searches, reports, and REST API usage.
- Splunk Agentic Ops Hackathon: platform track, MCP Server, AI Assistant, Hosted Models, and AI for Splunk Apps.

---

## 36. Final MVP Build Recommendation

For the hackathon, do not build every feature in this PRD. Build only the golden path:

```text
VS Code prompt → schema-aware SPL generation → Splunk execution → self-repair → result preview → dashboard/alert export
```

Make that one path beautiful, reliable, and easy to understand. That is what will make SPL Forge feel real.
