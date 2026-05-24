# SPL Forge Demo Runbook

Use this for hackathon recording, judge demo, or internal walkthrough.

## Demo Objective

Show SPL Forge can:

- accept plain-English request
- generate SPL
- run or simulate execution
- detect issue
- repair query
- preview output
- export artifact concept

## Recommended Prompt

```text
Create failed login dashboard by country and user agent for last 30 minutes.
Add alert if failed attempts exceed 100 in 5 minutes.
```

## Demo Flow

### 1. Open Context

Show repository and explain value in one line:

> SPL Forge turns natural-language intent into validated Splunk artifacts.

### 2. Show Prompt Entry

Enter prompt in VS Code extension or mock UI.

### 3. Show Generated SPL

Briefly explain output:

- search source chosen
- aggregation logic
- threshold logic

### 4. Show Failure

Use one predictable issue:

- missing field
- wrong sourcetype
- empty result because of schema mismatch

### 5. Show Repair

Demonstrate:

- schema inspection
- rewritten SPL
- successful rerun

### 6. Show Artifact Output

Preview:

- dashboard layout draft
- alert definition draft
- app-ready export direction

## Timing Guide

- Intro: 15 seconds
- Prompt and generation: 30 seconds
- Error and repair: 40 seconds
- Artifact preview: 30 seconds
- Close: 20 seconds

Total target: under 2 minutes. Hard cap: 3 minutes.

## Backup Plan

If live environment unstable:

1. Switch to mock mode
2. Reuse same prompt
3. Show same repair narrative
4. Keep flow moving

## Demo Checklist

- Browser tabs closed
- Splunk Enterprise free trial instance already running with Developer License applied
- Splunk session already authenticated
- Prompt copied and ready
- Backup screenshots ready
- Mock fallback ready
- No secrets visible on screen

## Judge-Facing Talking Points

- Built for Splunk developer productivity
- Uses execution feedback, not blind text generation
- Supports MCP-first agentic workflow
- Keeps human in control before export

## Related Docs

- [`PRD.md`](./PRD.md)
- [`ROADMAP.md`](./ROADMAP.md)
- [`SPLUNK_SETUP.md`](./SPLUNK_SETUP.md)
