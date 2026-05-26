# SPL Forge Progress

Actual repo status as of 2026-05-25.

## Overall State

SPL Forge now has product definition, setup documentation, Day 1 environment guidance, sample data, Day 2 prompt flow, completed Day 3 query generation, working Day 4 Splunk execution through MCP/REST/mock modes, and a Day 5 self-debugging repair loop.

## Completed

- [x] Repository banner and presentation assets added
- [x] Main project README rewritten and aligned with product direction
- [x] Product requirements document added in [`PRD.md`](../PRD.md)
- [x] Roadmap added in [`ROADMAP.md`](../ROADMAP.md)
- [x] Quickstart guide added in [`QUICKSTART.md`](./QUICKSTART.md)
- [x] VS Code setup guide added in [`VS_CODE_SETUP.md`](./VS_CODE_SETUP.md)
- [x] Free trial setup guide added in [`FREE_TRIAL_SETUP.md`](./FREE_TRIAL_SETUP.md)
- [x] Sample data fixture added in [`SAMPLE_DATA.md`](./SAMPLE_DATA.md)
- [x] Splunk setup guide added in [`SPLUNK_SETUP.md`](./SPLUNK_SETUP.md)
- [x] Architecture overview added in [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- [x] Demo runbook added in [`DEMO_RUNBOOK.md`](./DEMO_RUNBOOK.md)
- [x] Day 1 extension panel scaffold added in `src/panels/assistant.ts`
- [x] Day 1 status guide added in [`DAY1_STATUS.md`](./DAY1_STATUS.md)
- [x] Workspace extension recommendations updated to include official Splunk VS Code extension
- [x] Local Splunk Enterprise free trial installed manually
- [x] Official `Splunk.splunk` VS Code extension installed manually
- [x] Splunk Developer License requested and applied manually
- [x] Day 2 prompt input wired from webview to extension runtime
- [x] `.env.local`-aware config loader added in `src/config/env.ts`
- [x] LLM generation adapter with mock fallback added in `src/agent/generate.ts`
- [x] Raw provider output and parsed SPL render inside panel
- [x] Output channel logging added for prompt/provider/result
- [x] Day 3 intent parser added for artifact, breakdown, time window, and threshold hints
- [x] Day 3 schema-aware prompt builder added for LLM requests
- [x] Day 3 deterministic mock SPL generation improved for failed-login demo prompts
- [x] Panel updated to show query plan summary before execution stage
- [x] Day 3 prompt coverage expanded for dashboard, alert, trend, and relative-time prompts
- [x] Day 3 tests expanded to cover multiple prompt classes
- [x] Day 4 Splunk execution adapter added in `src/splunk/execute.ts`
- [x] Mock execution mode added for deterministic failed-login result previews
- [x] REST execution mode added for Splunk search export endpoint
- [x] MCP execution mode added for Splunk MCP Server `splunk_run_query`
- [x] MCP preflight added with `splunk_get_info`
- [x] Splunk runtime config expanded for URL, credentials, search limit, and self-signed TLS
- [x] Panel updated to show execution summary, messages, fields, and result preview
- [x] `.env.example` added for LLM and Splunk execution settings
- [x] Local self-hosted trial auth queries now auto-rewrite CSV fixture fields with `rex` and header filtering
- [x] Local stale demo time windows now auto-retry with `earliest=0`
- [x] Live localhost MCP smoke test verified against local Splunk MCP Server
- [x] Day 5 forge workflow added for generate -> execute -> schema inspect -> repair -> rerun
- [x] Schema inspection helper added for fields, indexes, sourcetypes, and messages
- [x] MCP schema inspection now calls `splunk_get_indexes` and `splunk_get_metadata`
- [x] Deterministic repair rules added for common index, sourcetype, field alias, action value, and time-window failures
- [x] Optional LLM repair prompt added after deterministic diagnostics
- [x] Repair auto-rerun policy flag added with panel visibility
- [x] Repair history added to panel and output channel
- [x] Root `architecture_diagram.md` added for hackathon submission requirements
- [x] MIT license added for open-source submission requirement

## Not Started Yet

- [ ] dashboard export generation
- [ ] alert export generation
- [ ] saved search packaging
- [ ] Splunk app packaging


## MVP Readiness Snapshot

| Area | Status | Notes |
|---|---|---|
| Product framing | Done | PRD and roadmap present |
| Repo presentation | Done | README and docs cleaned up |
| Setup guidance | Done | VS Code and Splunk guides present |
| Sample data prep | Done | Auth CSV fixture ready for import |
| Manual Splunk environment | Mostly done | Free trial + Developer License + Splunk VS Code extension confirmed |
| Demo planning | Done | Runbook present |
| Architecture direction | Done | High-level plan present with Day 1 and Day 2 scaffold notes |
| Extension code | Started | Prompt UI, panel messaging, provider adapter, output logging present |
| Splunk connectivity | Day 4 done | MCP, REST, and mock execution adapters exist; local MCP and REST smoke verified |
| Agent workflow | Day 3 done | Intent-aware query generation works via mock or configured LLM provider |
| Self-debug loop | Day 5 done | Executes once, inspects schema and MCP metadata after failure/empty rows, repairs common demo issues, optionally asks LLM for a safe repair, and reruns with capped attempts |
| Artifact export | Not started | No packaging code yet |
| Testing | Started | Extension tests pass locally with VS Code test runner; CI runs with xvfb on Ubuntu |

## Reality Check

If someone clones repo now, they get strong planning and setup docs plus real extension shell that accepts prompts, explains interpreted query intent, returns stronger demo-safe SPL, executes it through MCP, REST, or mock mode, and repairs common failed-login demo query mistakes after schema and MCP metadata inspection. Local self-hosted trial auth fixture queries are rewritten so imported CSV data works in live MCP demos. Export flow is not built yet.

## Next Logical Build Order

1. Add dashboard export flow
2. Add alert export flow
3. Add Splunk app packaging
