# SPL Forge Demo Runbook

Use this for hackathon recording, judge demo, or internal walkthrough.

## Demo Objective

Show SPL Forge can:

- accept plain-English request
- generate SPL through Splunk model adapter
- run live execution in Splunk
- detect issue
- repair query
- preview output
- export app-ready artifacts
- publish dashboard plus disabled alert to Splunk through REST

## Recommended Prompt

```text
Create a failed login dashboard by country and user agent for the last 30 minutes. Alert if failed attempts exceed 100 in 5 minutes.
```

## Demo Flow

### 1. Open Context

Show repository and explain value in one line:

> SPL Forge turns natural-language intent into validated Splunk artifacts.

### 2. Show Prompt Entry

Enter prompt in VS Code extension or standalone browser dashboard.

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
- repair history in the VS Code panel

### 6. Show Artifact Output

Preview:

- dashboard layout draft
- alert definition draft
- app-ready folder with `app.conf`, dashboard XML, disabled saved search, metadata, and demo sourcetype extraction config

### 7. Publish Path

Click `Publish to Splunk` and show:

- dashboard created or updated
- disabled alert created or updated
- dashboard and saved-search endpoints reloaded
- dashboard URL available in panel

## Timing Guide

- Intro: 15 seconds
- Prompt and generation: 30 seconds
- Error and repair: 40 seconds
- Artifact preview and publish: 45 seconds
- Close: 20 seconds

Total target: under 2 minutes. Hard cap: 3 minutes.

## Demo Checklist

- Browser tabs closed
- Splunk Enterprise free trial instance already running with Developer License applied
- Splunk session already authenticated
- Splunk MCP AI Assistant tool or Splunk-hosted model endpoint configured
- `npm run verify:submission` already passed on the exact repo state being demonstrated
- Prompt copied and ready
- Backup screenshots ready
- Mock fallback ready
- No secrets visible on screen

## Judge-Facing Talking Points

- Built for Splunk developer productivity
- Uses execution feedback, not blind text generation
- Supports MCP-first agentic workflow
- Keeps human in control before export
- Publishes only reviewed, disabled alert artifacts by default
- Uses Splunk-only model wiring; no third-party model API keys needed
- Uses live Splunk-hosted model generation and live Splunk query execution during verification
- Does not claim full app install automation or true separate sub-agents yet
- Meets hackathon repo requirements with root architecture diagram and open-source license

## Related Docs

- [`PRD.md`](../PRD.md)
- [`ROADMAP.md`](../ROADMAP.md)
- [`SPLUNK_SETUP.md`](./SPLUNK_SETUP.md)
