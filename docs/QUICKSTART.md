# SPL Forge Quickstart

Use this guide if you want fastest path from clone to walkthrough.

## What This Repository Contains

SPL Forge contains product docs plus a working VS Code extension and standalone browser dashboard for an AI-native Splunk development workspace. It is not production-complete, but a working Splunk-hosted-model path, Splunk execution, repair, dashboard/alert artifact generation, app-folder export, and REST publish are implemented.

Core docs:

- [`PRD.md`](../PRD.md) for product scope and release definition
- [`ROADMAP.md`](../ROADMAP.md) for phased delivery plan
- [`VS_CODE_SETUP.md`](./VS_CODE_SETUP.md) for editor environment
- [`SPLUNK_SETUP.md`](./SPLUNK_SETUP.md) for Splunk-side preparation

## Recommended First-Run Path

1. Read [`PRD.md`](../PRD.md) to understand intended workflow.
2. Complete [`VS_CODE_SETUP.md`](./VS_CODE_SETUP.md).
3. Complete [`FREE_TRIAL_SETUP.md`](./FREE_TRIAL_SETUP.md).
4. Review [`SPLUNK_SETUP.md`](./SPLUNK_SETUP.md) for MCP or REST integration mode.
5. Load [`SAMPLE_DATA.md`](./SAMPLE_DATA.md) fixture into Splunk.
6. Review [`ARCHITECTURE.md`](./ARCHITECTURE.md) before implementation work.
7. Use [`WALKTHROUGH_RUNBOOK.md`](./WALKTHROUGH_RUNBOOK.md) if preparing a product walkthrough.

## Validation Goal

Target scenario:

```text
Create failed login dashboard by country and user agent.
Alert if failed logins exceed threshold in 5 minutes.
```

Expected flow:

```text
Prompt -> Generate SPL -> Run in Splunk -> Detect issue -> Repair -> Preview -> Export app -> Publish dashboard/alert
```

## Current Deliverables

- Product definition
- Roadmap
- Setup guidance
- Walkthrough planning
- Architecture notes
- VS Code panel for prompt input
- Splunk MCP AI Assistant tool or Splunk-hosted model endpoint generation path
- Query plan rendering
- MCP execution adapter for Splunk MCP Server `splunk_run_query`
- REST execution adapter for Splunk search export endpoint
- Repair loop with schema inspection and retry history
- Dashboard Studio JSON preview and Classic XML dashboard export
- Disabled saved-search alert preview
- App folder export with app.conf, props.conf, transforms.conf, dashboard XML, savedsearches.conf, metadata, README, and manifest
- REST publish for dashboard plus disabled alert, with endpoint reloads
- Standalone browser dashboard via `npm run dashboard`
- Release verifier via `npm run verify:release`

## Not Yet Included

- Full Splunk app install automation
- True multi-agent runtime with separate specialized sub-agents

## Suggested Next Build Order

1. Add app archive/install automation
2. Add richer validation for each generated Splunk app file
3. Split workflow stages into separately observable sub-agents when the product needs deeper runtime transparency

## Need More Context

- Product scope: [`PRD.md`](../PRD.md)
- Build sequence: [`ROADMAP.md`](../ROADMAP.md)
- System layout: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
