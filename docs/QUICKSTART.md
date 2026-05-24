# SPL Forge Quickstart

Use this guide if you want fastest path from clone to demo.

## What This Repository Contains

SPL Forge currently documents a product direction for an AI-native Splunk development workspace. The repository is in planning and setup stage, not production-complete implementation stage.

Core docs:

- [`PRD.md`](./PRD.md) for product scope and MVP definition
- [`ROADMAP.md`](./ROADMAP.md) for phased delivery plan
- [`VS_CODE_SETUP.md`](./VS_CODE_SETUP.md) for editor environment
- [`SPLUNK_SETUP.md`](./SPLUNK_SETUP.md) for Splunk-side preparation

## Recommended First-Run Path

1. Read [`PRD.md`](./PRD.md) to understand intended workflow.
2. Complete [`VS_CODE_SETUP.md`](./VS_CODE_SETUP.md).
3. Complete [`FREE_TRIAL_SETUP.md`](./FREE_TRIAL_SETUP.md).
4. Review [`SPLUNK_SETUP.md`](./SPLUNK_SETUP.md) for MCP, REST, or mock integration mode.
5. Review [`ARCHITECTURE.md`](./ARCHITECTURE.md) before implementation work.
6. Use [`DEMO_RUNBOOK.md`](./DEMO_RUNBOOK.md) if preparing hackathon walkthrough.

## MVP Demo Goal

Target scenario:

```text
Create failed login dashboard by country and user agent.
Alert if failed logins exceed threshold in 5 minutes.
```

Expected flow:

```text
Prompt -> Generate SPL -> Run in Splunk -> Detect issue -> Repair -> Preview -> Export artifact
```

## Current Deliverables

- Product definition
- Roadmap
- Setup guidance
- Demo planning
- Architecture notes

## Not Yet Included

- Finished VS Code extension source
- Live MCP integration implementation
- Dashboard export engine
- Alert packaging logic

## Suggested Next Build Order

1. Scaffold VS Code extension
2. Add LLM prompt pipeline
3. Add Splunk connectivity via MCP or REST
4. Add retry and repair loop
5. Add preview and export layer

## Need More Context

- Product scope: [`PRD.md`](./PRD.md)
- Build sequence: [`ROADMAP.md`](./ROADMAP.md)
- System layout: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
