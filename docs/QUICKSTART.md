# SPL Forge Quickstart

Use this guide if you want fastest path from clone to demo.

## What This Repository Contains

SPL Forge contains product docs plus an active VS Code extension scaffold for an AI-native Splunk development workspace. It is not production-complete, but prompt generation and initial Splunk execution plumbing are implemented.

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
5. Load [`SAMPLE_DATA.md`](./SAMPLE_DATA.md) fixture into Splunk.
6. Review [`ARCHITECTURE.md`](./ARCHITECTURE.md) before implementation work.
7. Use [`DEMO_RUNBOOK.md`](./DEMO_RUNBOOK.md) if preparing hackathon walkthrough.

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
- VS Code panel for prompt input
- LLM/mock SPL generation path
- Query plan rendering
- Mock Splunk execution with result preview
- MCP execution adapter for Splunk MCP Server `splunk_run_query`
- REST execution adapter for Splunk search export endpoint

## Not Yet Included

- Self-debugging repair loop
- Dashboard export engine
- Alert packaging logic

## Suggested Next Build Order

1. Add schema inspection flow
2. Add retry and repair loop
3. Add dashboard export engine
4. Add alert packaging logic

## Need More Context

- Product scope: [`PRD.md`](./PRD.md)
- Build sequence: [`ROADMAP.md`](./ROADMAP.md)
- System layout: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
