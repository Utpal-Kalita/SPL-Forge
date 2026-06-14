# Splunk Free Trial + Developer License Setup

Use this guide for local SPL Forge setup.

Goal: run local Splunk Enterprise instance, then convert trial terms to developer use with Splunk Developer License.

## What You Need

- Free Splunk account
- Splunk Enterprise free trial installer
- Splunk Developer Program access
- Machine that can run local Splunk Enterprise

## Recommended Flow

1. Create free Splunk account.
2. Download Splunk Enterprise free trial.
3. Install Splunk Enterprise locally.
4. Start Splunk and confirm login works.
5. Request Developer License through Splunk Developer Program.
6. Apply Developer License to local Splunk instance.
7. Load sample data for SPL Forge validation and walkthroughs.

## Step 1: Create Splunk Account

Create or sign in to your free Splunk account.

Use same account for:

- trial download
- developer program access
- license request flow

## Step 2: Download Splunk Enterprise Free Trial

Download latest Splunk Enterprise free trial for your OS.

Need:

- Splunk Web UI on port `8000`
- Splunk management API on port `8089`

Those ports matter for SPL Forge REST or MCP connectivity.

## Step 3: Install and Start Splunk

Install trial build normally for your platform.

During install or first launch:

- create admin username and password
- accept Splunk terms
- start Splunk services

After startup, verify:

- Splunk Web opens at `http://localhost:8000`
- login works
- management API responds on `https://localhost:8089`

## Step 4: Request Developer License

After trial instance works, request Splunk Developer License through Splunk Developer Program.

Developer license intent:

- free trial gets you initial local install
- Developer License changes usage agreement to developer use cases
- Developer License validity is typically longer than base trial window

If you already have existing Splunk Enterprise or Splunk Cloud license, request Developer License and apply it to that instance instead of reinstalling.

## Step 5: Apply Developer License

In Splunk Web:

1. Open license management page.
2. Upload or apply Developer License provided by Splunk.
3. Confirm license status updates successfully.

After applying, re-check:

- Splunk login still works
- searches run normally
- management API remains reachable

## Step 6: Load Validation Data

Load authentication or access logs with fields like:

- `timestamp`
- `user`
- `src`
- `country`
- `user_agent`
- `action`
- `sourcetype`
- `index`

For local validation, set:

- `sourcetype=auth`
- `index=main`

## Step 7: Verify with Sample SPL

Run these in Splunk Search:

```spl
index=main sourcetype=auth | head 10
```

```spl
index=main sourcetype=auth action=failure | stats count
```

```spl
index=main sourcetype=auth action=failure | stats count by country
```

```spl
index=main sourcetype=auth action=failure | top user
```

## Suggested Local Env Values

Use local config like:

```bash
SPLUNK_HOST=https://localhost:8089
SPLUNK_USERNAME=admin
SPLUNK_PASSWORD=<your-local-password>
SPLUNK_INDEX=main
SPLUNK_VERIFY_SSL=false
SPL_FORGE_ENV=development
SPL_FORGE_SPLUNK_MODE=rest
SPL_FORGE_SPLUNK_SOURCE=self_hosted_trial
SPL_FORGE_SPLUNK_URL=https://localhost:8089
SPL_FORGE_SPLUNK_USERNAME=admin
SPL_FORGE_SPLUNK_PASSWORD=<your-local-password>
SPL_FORGE_SPLUNK_ALLOW_SELF_SIGNED=true
SPL_FORGE_SPLUNK_SEARCH_LIMIT=10
```

## When to Use Other Modes

- Use Splunk Cloud sandbox if you need hosted environment.
- Use MCP mode if Splunk MCP Server already configured.

## Related Docs

- [`SPLUNK_SETUP.md`](./SPLUNK_SETUP.md)
- [`SAMPLE_DATA.md`](./SAMPLE_DATA.md)
- [`VS_CODE_SETUP.md`](./VS_CODE_SETUP.md)
- [`WALKTHROUGH_RUNBOOK.md`](./WALKTHROUGH_RUNBOOK.md)
