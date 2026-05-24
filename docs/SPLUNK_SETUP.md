# Splunk Setup

This guide prepares Splunk side for SPL Forge MVP demos and development.

## Goal

Need environment where SPL Forge can:

- run searches
- inspect fields
- validate generated SPL
- preview results
- simulate repair loop

## Supported Modes

Choose one:

- MCP mode for agent-friendly integration
- REST mode for direct API execution
- Mock mode for demo-safe offline flow

## Recommended Development Options

Start with [`FREE_TRIAL_SETUP.md`](./FREE_TRIAL_SETUP.md) if you need local Splunk Enterprise for hackathon or MVP work.

### Option 1: Splunk Enterprise Dev Instance

Best for local hands-on testing.

- Install local Splunk Enterprise free trial
- Request Splunk Developer License
- Apply Developer License to trial instance
- Create admin user
- Load sample logs
- Enable management port access

### Option 2: Splunk Cloud Sandbox

Best for realistic hosted environment.

- Provision sandbox or trial tenant
- Create restricted service account
- Confirm API access
- Load sample data or use provided datasets

### Option 3: Mock Mode

Best for hackathon fallback.

- Prepare example field schema
- Prepare mock query responses
- Prepare at least one intentional failure case

## Minimum Data Needed

For MVP failed-login scenario, ensure logs include:

- timestamp
- user
- src or source IP
- country or geolocation-enriched field
- user agent
- action or outcome field
- sourcetype
- index

## Suggested Demo Dataset

Use authentication or access logs with enough records to support:

- failed login trends
- top users
- top countries
- top user agents
- threshold-based alert example

## MCP Preparation

If using Splunk MCP Server:

1. Install and configure MCP server.
2. Set auth token or approved credential flow.
3. Verify tools expose search and metadata access.
4. Confirm IDE client can connect without manual reauth during demo.

## REST Preparation

If using REST fallback:

1. Confirm management endpoint reachable.
2. Create least-privilege service credentials.
3. Test search execution endpoint.
4. Test field discovery endpoint.

## Security Rules

- Never commit Splunk passwords or tokens
- Use least-privilege accounts
- Prefer read-only search capabilities for MVP
- Avoid destructive or admin-wide write operations in demo

## Demo Validation Checklist

- Can run sample SPL query successfully
- Can retrieve field metadata
- Can show one broken query example
- Can show repaired query example
- Can preview results quickly

## Example Scenario

Prompt:

```text
Create dashboard for failed login attempts by country and user agent.
Alert when failed logins exceed 100 in 5 minutes.
```

What Splunk environment must support:

- search auth-related events
- aggregate by geography and user agent
- compute threshold over time window
- return enough data for chart preview

## Fallback Plan

If live Splunk fails during demo:

1. Switch to mock mode
2. Reuse same prompt
3. Show generated SPL
4. Show simulated failure
5. Show repair cycle
6. Show prepared artifact preview

## Related Docs

- [`FREE_TRIAL_SETUP.md`](./FREE_TRIAL_SETUP.md)
- [`VS_CODE_SETUP.md`](./VS_CODE_SETUP.md)
- [`DEMO_RUNBOOK.md`](./DEMO_RUNBOOK.md)
- [`PRD.md`](./PRD.md)
