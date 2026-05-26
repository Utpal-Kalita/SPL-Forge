# SPL Forge Architecture Diagram

```mermaid
flowchart LR
    User["User in VS Code"] --> Panel["SPL Forge Webview Panel"]
    Panel --> Workflow["Forge Workflow\nGenerate -> Execute -> Inspect -> Repair"]
    Workflow --> Agent["Agent Layer\nIntent parser + LLM/mock SPL generation + repair rules"]
    Workflow --> Adapter["Splunk Adapter\nMCP / REST / Mock"]
    Adapter --> MCP["Splunk MCP Server\nsplunk_get_info + splunk_run_query"]
    Adapter --> REST["Splunk REST API\n/services/search/jobs/export"]
    Adapter --> Mock["Deterministic demo fixture\nfailed_login_auth.csv shape"]
    MCP --> Splunk["Splunk Enterprise / Cloud"]
    REST --> Splunk
    Splunk --> Adapter
    Mock --> Adapter
    Adapter --> Schema["Schema Summary\nfields, indexes, sourcetypes, messages"]
    Schema --> Agent
    Agent --> Workflow
    Workflow --> Results["Final SPL + repair history + result preview"]
    Results --> Panel
    Workflow -. next .-> Artifacts["Dashboard / Alert / App Export"]
```

## Data Flow

1. User enters natural-language Splunk intent in VS Code.
2. Agent layer generates a candidate SPL query.
3. Splunk adapter executes through MCP, REST, or mock mode.
4. If execution fails or returns zero rows, schema inspection gathers fields, index, sourcetype, and messages.
5. Repair logic rewrites common index, sourcetype, field, login-action, and time-window problems.
6. Workflow reruns repaired SPL with capped attempts and renders final result in panel.

## AI And Splunk Integration

- AI layer: prompt intent parser, provider-backed SPL generation, deterministic mock fallback, and repair reasoning.
- Splunk layer: MCP-first query execution with REST fallback and mock mode for reliable demos.
- Safety posture: read-only search execution, bounded search limits, no destructive commands, human approval planned before export.
