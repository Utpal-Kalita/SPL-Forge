# SPL Forge Progress

Actual repo status as of 2026-05-25.

## Overall State

SPL Forge now has product definition, setup documentation, sample data, prompt flow, Splunk-only model generation, Splunk execution through MCP/REST, a self-debugging repair loop, dashboard plus alert artifact previews, app-folder export with demo sourcetype extraction config, REST publish with endpoint reloads, standalone browser dashboard, and a polished VS Code panel workflow.

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
- [x] Splunk-only LLM generation adapter added in `src/agent/generate.ts`
- [x] Raw provider output and parsed SPL render inside panel
- [x] Output channel logging added for prompt/provider/result
- [x] Day 3 intent parser added for artifact, breakdown, time window, and threshold hints
- [x] Day 3 schema-aware prompt builder added for LLM requests
- [x] Day 3 deterministic mock SPL generation improved for failed-login demo prompts
- [x] Panel updated to show query plan summary before execution stage
- [x] Day 3 prompt coverage expanded for dashboard, alert, trend, and relative-time prompts
- [x] Day 3 tests expanded to cover multiple prompt classes
- [x] Day 4 Splunk execution adapter added in `src/splunk/execute.ts`
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
- [x] Day 6 dashboard artifact generator added for Dashboard Studio JSON previews
- [x] Panel now renders dashboard artifact title, visualization type, fields, and JSON
- [x] Alert artifact generator added for saved-search configuration previews
- [x] Panel now renders alert title, threshold condition, schedule, and savedsearches.conf draft
- [x] Dashboard artifact now includes classic XML that can be loaded into Splunk UI
- [x] `npm run publish:dashboard` publishes the generated dashboard to Splunk UI through REST using the verified executable search
- [x] `npm run export:app` writes a minimal Splunk app folder with app.conf, dashboard XML, savedsearches.conf, metadata, README, and manifest
- [x] Generated app includes `props.conf` and `transforms.conf` scaffolding for `auth` and `auth_complex` demo sourcetypes
- [x] Day 8 panel polish added with professional command layout, query history, error log, Export App button, and Publish to Splunk button
- [x] Panel Export App writes the current verified Splunk app package to `exports/spl_forge_generated_app`
- [x] Panel Publish to Splunk writes dashboard XML and a disabled saved-search alert through Splunk REST
- [x] Publish flow reloads Splunk dashboard and saved-search REST endpoints after create/update
- [x] Day 9 trend-by-breakdown fix preserves `timechart ... by country` for trend dashboard prompts
- [x] Day 9 prompt coverage added for successful-login dashboards, top source-IP searches, threshold-window alerts, and unsafe provider output
- [x] `npm run verify:prompts -- --mode mcp --all --delay-ms 2500` verified against 16 real Splunk-model/MCP prompt scenarios
- [x] Complex `auth_complex` prompt coverage added for high-risk auth, privileged activity, MFA failures, service-account activity, impossible travel, and failed/blocked outcomes
- [x] Third-party API-key model providers removed from active config; Splunk model provider now uses MCP AI Assistant tool or Splunk-hosted model endpoint
- [x] Standalone browser dashboard added via `npm run dashboard`
- [x] Root `architecture_diagram.md` added for hackathon submission requirements
- [x] MIT license added for open-source submission requirement
- [x] `npm run verify:submission` added to check submission-critical repo and live Splunk requirements

## Not Implemented / Do Not Claim

- [ ] Full Splunk app install automation
- [ ] True multi-agent runtime with separate specialized sub-agents

## Still Pending

- [ ] App archive packaging or install endpoint automation
- [ ] Human approval controls before provider-backed LLM repair auto-rerun
- [ ] Richer app validation before import

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
| Splunk connectivity | Day 4 done | MCP and REST execution adapters exist; local MCP and REST smoke verified |
| Agent workflow | Day 3 done | Intent-aware query generation works via Splunk model provider |
| Self-debug loop | Day 5 done | Executes once, inspects schema and MCP metadata after failure/empty rows, repairs common demo issues, optionally asks LLM for a safe repair, and reruns with capped attempts |
| Artifact export | Day 7 done | Dashboard Studio JSON, classic dashboard XML, Splunk UI dashboard publish, alert saved-search preview, local app-folder export, and demo sourcetype extraction config exist |
| UX | Day 8 done | Prompt, run, export, publish, history, error log, execution summary, and artifact previews are in VS Code panel plus standalone browser dashboard |
| Testing and iteration | Day 9 in progress | Complex prompt coverage added; 16 real Splunk-model/MCP prompts pass with verifier |
| Testing | Started | Extension tests pass locally with VS Code test runner; CI runs with xvfb on Ubuntu |

## Reality Check

If someone clones repo now, they get strong planning and setup docs plus real extension panel and browser dashboard that accept prompts, explain interpreted query intent, return stronger demo-safe SPL, execute it through MCP or REST, repair common failed-login demo query mistakes after schema and MCP metadata inspection, preview Dashboard Studio JSON plus saved-search alert config for dashboard/alert prompts, publish a generated dashboard plus disabled alert into Splunk UI via REST with endpoint reloads, and export a Splunk app folder from panel, browser dashboard, or CLI. Local self-hosted trial auth fixture queries are rewritten so imported CSV data works in live MCP demos, and exported apps include CSV extraction stanzas for `auth` and `auth_complex`. Day 9 coverage checks prompt shapes including trends, successful logins, source IP grouping, threshold windows, generic auth investigation, and unsafe provider artifacts.

## Next Logical Build Order

1. Add app archive packaging or install endpoint automation
2. Add human approval controls before provider-backed repair auto-rerun
3. Add richer app validation before import
