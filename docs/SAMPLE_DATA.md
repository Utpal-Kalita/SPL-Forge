# Sample Data

Use this fixture for local setup and repeatable validation runs.

## Included File

- `samples/failed_login_auth.csv`
- `samples/complex_auth_security.csv`

## Intended Splunk Settings

- `index=main`
- `sourcetype=auth`

## Why This Fixture Exists

Roadmap Day 1 requires sample data prepared in Splunk.

This file supports:

- failed login counts
- country aggregation
- user aggregation
- user agent aggregation
- simple threshold alert examples

`complex_auth_security.csv` supports richer Day 9/Day 10 scenarios:

- successful, failed, and blocked login outcomes
- MFA challenge outcomes
- service-account token usage
- privileged actions
- risk-score filtering
- app, destination, role, device, and session breakdowns
- suspicious source-IP and impossible-travel style walkthroughs

## Import Options

### Splunk Web

1. Open Splunk Web.
2. Go to `Settings -> Add Data`.
3. Upload `samples/failed_login_auth.csv`.
4. Set source type to `auth`.
5. Set destination index to `main`.

For complex scenarios, upload `samples/complex_auth_security.csv` with:

- source type: `auth_complex`
- destination index: `main`

### CLI One-Shot Import

Run on host where Splunk Enterprise is installed:

```bash
splunk add oneshot /absolute/path/to/samples/failed_login_auth.csv \
  -sourcetype auth \
  -index main \
  -auth admin:<your-password>
```

```bash
splunk add oneshot /absolute/path/to/samples/complex_auth_security.csv \
  -sourcetype auth_complex \
  -index main \
  -auth admin:<your-password>
```

## Verification SPL

```spl
index=main sourcetype=auth | head 10
```

```spl
index=main sourcetype=auth action=failure | stats count by country
```

```spl
index=main sourcetype=auth action=failure | top user
```

## Complex Dataset Verification SPL

```spl
index=main sourcetype=auth_complex | head 10
```

```spl
index=main sourcetype=auth_complex
| stats count avg(risk_score) as avg_risk by outcome country app
| sort - count
```

```spl
index=main sourcetype=auth_complex outcome=failure
| stats count max(risk_score) as max_risk by user src role
| where count >= 2 OR max_risk >= 80
| sort - max_risk
```

## Prompt Ideas

```text
Create a high-risk authentication dashboard by country, app, and role. Alert if risk_score exceeds 90.
```

```text
Show failed and blocked login attempts by source IP and user agent for the complex auth dataset.
```

```text
Create a privileged action dashboard by user, app, and country. Alert on risk score over 85.
```

## Automated Prompt Verification

After importing both CSV files into local Splunk, run the real Splunk-model-plus-MCP prompt suite:

```bash
npm run verify:prompts -- --mode mcp --all --delay-ms 2500
```

For only the complex dataset scenarios:

```bash
npm run verify:prompts -- --mode mcp --complex --delay-ms 2500
```
