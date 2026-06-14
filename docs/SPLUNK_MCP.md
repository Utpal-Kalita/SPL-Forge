# Splunk MCP Server Guide

Structured notes for using Splunk MCP Server with SPL Forge.

## Purpose

SPL Forge uses Splunk MCP Server as its preferred agent-to-Splunk bridge.

MCP gives SPL Forge a controlled way to:

- run generated SPL against real Splunk data
- inspect Splunk environment metadata
- discover indexes, sourcetypes, and knowledge objects
- feed execution errors and schema context back into the repair loop
- keep credentials scoped to MCP client usage

REST remains a fallback path. Mock mode remains available for offline walkthroughs and CI-safe tests.

## Current SPL Forge Status

| Area | Status |
| --- | --- |
| MCP preflight | Implemented with `splunk_get_info` |
| MCP query execution | Implemented with `splunk_run_query` |
| MCP metadata discovery | Implemented with `splunk_get_indexes` and `splunk_get_metadata` |
| Self-debug repair loop | Implemented with deterministic repair plus optional LLM repair |
| Dashboard generation | Implemented as Dashboard Studio JSON and classic XML |
| Dashboard publish | Implemented through REST with `npm run publish:dashboard` and panel Publish to Splunk |
| Alert preview | Implemented as saved-search configuration draft |
| Alert publish | Implemented through panel Publish to Splunk; saved search remains disabled by default |
| Splunk app folder export | Implemented with `npm run export:app` |
| Zip packaging | Planned |

## Recommended Integration Position

For SPL Forge's current release:

- Use Splunk MCP Server app as the primary integration path.
- Use REST only for fallback and write-style operations that MCP does not cover yet.
- Do not depend on legacy cloud-hosted SCS endpoint for new deployments.
- Use encrypted MCP tokens for MCP access.
- Keep direct Splunk REST tokens separate from MCP encrypted tokens.

## Release Notes Snapshot

| Version | Date | Notes |
| --- | --- | --- |
| `1.1.3` | 2026-05-19 | Fixed API custom tool creation when request body is provided as a string. |
| `1.1.2` | 2026-05-12 | App improvements, enhanced logging, and minor fixes. |
| `1.1.1` | 2026-04-28 | Fixed Windows issue causing server to display inactive. |
| `1.1.0` | 2026-04-01 | Added OAuth 2.1 controlled-access support, beta saved search execution, and beta rate limiting. |
| `1.0.5` | 2026-03-26 | Fixed RSA key pair conflicts on Search Head Clusters. |
| `1.0.0` | GA | Splunk MCP Server generally available; encrypted tokens required. |

## Deployment Model

### Preferred Path

Install Splunk MCP Server app on:

- Splunk Search Head
- Splunk Search Head Cluster
- Splunk Cloud deployment where app installation is supported

### Legacy Endpoint

The old cloud-hosted `*.api.scs.splunk.com` SCS MCP endpoint is deprecated for new deployments. Existing users should migrate to the Splunk MCP Server app.

Migration steps:

1. Install Splunk MCP Server app.
2. Assign MCP capabilities.
3. Generate encrypted MCP token.
4. Update MCP client endpoint.
5. Test tool execution.
6. Decommission old endpoint/token usage.

## Splunk Prerequisites

Required:

- REST API access enabled.
- Token authentication enabled.
- Splunk MCP Server app installed.
- User role can access required APIs.
- User role has `mcp_tool_execute`.

Optional:

- `mcp_tool_admin` for tool management and token creation.
- Splunk AI Assistant app for `saia_*` tools.
- OAuth 2.1 support if enabled through controlled access.

## RBAC

| Capability | Purpose |
| --- | --- |
| `mcp_tool_execute` | Lets users call MCP tools. |
| `mcp_tool_admin` | Lets admins manage MCP tools and token creation. |

Token creation requirements:

| Scenario | Required capabilities |
| --- | --- |
| User creates own token | `edit_tokens_own` and `mcp_tool_admin` |
| Admin creates token for any user | `edit_tokens_all` and `mcp_tool_admin` |

For SPL Forge walkthroughs, grant only the minimum role needed to run searches and read metadata.

## Authentication

Splunk MCP Server uses encrypted MCP tokens.

Rules:

- Token is generated inside Splunk MCP Server app.
- Token is displayed once.
- Token is used by MCP clients only.
- Token cannot be reused as a direct Splunk REST token.
- Token can be invalidated in MCP app.
- Global key invalidation invalidates all encrypted MCP access tokens.

SPL Forge uses these variables for MCP:

```bash
SPL_FORGE_SPLUNK_MODE=mcp
SPL_FORGE_SPLUNK_MCP_ENDPOINT=https://localhost:8089/services/mcp
SPL_FORGE_SPLUNK_MCP_TOKEN=<encrypted-mcp-token>
SPL_FORGE_SPLUNK_MCP_ALLOW_SELF_SIGNED=false
SPL_FORGE_SPLUNK_SEARCH_LIMIT=10
```

For local self-signed Splunk MCP testing only:

```bash
SPL_FORGE_SPLUNK_MCP_ALLOW_SELF_SIGNED=true
```

## MCP Client Shape

Generic client configuration shape:

```json
{
  "mcpServers": {
    "splunk-mcp-server": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://<MCP_SERVER_ENDPOINT>",
        "--header",
        "Authorization: Bearer <YOUR_ENCRYPTED_TOKEN>"
      ]
    }
  }
}
```

Replace:

| Placeholder | Value |
| --- | --- |
| `<MCP_SERVER_ENDPOINT>` | Endpoint copied from Splunk MCP Server app. |
| `<YOUR_ENCRYPTED_TOKEN>` | Encrypted MCP token generated in Splunk MCP Server app. |

## Tool Namespaces

| Prefix | Source |
| --- | --- |
| `splunk_` | Core Splunk platform tools. |
| `saia_` | Splunk AI Assistant tools. |

SPL Forge currently depends only on `splunk_*` tools.

## Key Tools For SPL Forge

| Tool | SPL Forge usage |
| --- | --- |
| `splunk_get_info` | MCP preflight and connection proof. |
| `splunk_run_query` | Execute generated/repaired SPL and preview rows. |
| `splunk_get_indexes` | Discover index names for repair context. |
| `splunk_get_metadata` | Discover sourcetypes, hosts, and source context. |
| `splunk_get_knowledge_objects` | Future saved searches, views, alerts, and macros discovery. |
| `splunk_run_saved_search` | Future beta path for running approved saved searches. |

## Query Guardrails

`splunk_run_query` is meant for safe, bounded searches.

Common guardrails:

- unsafe/destructive commands can be blocked
- long execution can be rejected
- large responses can be capped
- tool access can be disabled server-side

SPL Forge additionally strips or blocks risky provider output such as:

- `alert`
- `sendemail`
- `outputlookup`
- `delete`
- `collect`

Dashboard and alert artifacts are generated separately from the preview SPL.

## SPL Forge Runtime Modes

### MCP Mode

Preferred product path:

```bash
SPL_FORGE_SPLUNK_MODE=mcp
SPL_FORGE_SPLUNK_MCP_ENDPOINT=https://localhost:8089/services/mcp
SPL_FORGE_SPLUNK_MCP_TOKEN=<encrypted-mcp-token>
SPL_FORGE_SPLUNK_SOURCE=self_hosted_trial
```

Used for:

- live prompt execution
- schema discovery
- repair loop
- dashboard/alert artifact generation from verified search

### REST Mode

Fallback path:

```bash
SPL_FORGE_SPLUNK_MODE=rest
SPL_FORGE_SPLUNK_URL=https://localhost:8089
SPL_FORGE_SPLUNK_USERNAME=admin
SPL_FORGE_SPLUNK_PASSWORD=REDACTED_SAMPLE_PASSWORD
SPL_FORGE_SPLUNK_ALLOW_SELF_SIGNED=true
```

Used for:

- search execution fallback
- dashboard publish through Splunk management REST

### Mock Mode

Offline path:

```bash
SPL_FORGE_SPLUNK_MODE=mock
```

Used for:

- deterministic unit tests
- walkthroughs when Splunk is unavailable

## Local Fixture Behavior

For `SPL_FORGE_SPLUNK_SOURCE=self_hosted_trial`, SPL Forge handles imported CSV fixture data by:

- rewriting auth queries with `rex field=_raw`
- filtering out the CSV header row
- adding `earliest=0` when local validation timestamps are stale

This is why the panel can show rows even when a raw dashboard search would otherwise return zero rows.

The dashboard publisher now publishes the verified executable search, not the display-only SPL.

## Verification Commands

Run local tests:

```bash
npm test
```

Verify live REST and MCP:

```bash
npm run verify:splunk -- --mode all
```

Run panel flow manually:

```text
SPL Forge: Open Panel
```

Prompt:

```text
Create a failed login dashboard by country and user agent. Alert if failed attempts exceed 100 in 5 minutes.
```

Expected:

- MCP mode success
- 12 failed-login rows on local fixture
- dashboard artifact preview
- alert artifact preview
- no mock data when MCP env is configured

Publish generated dashboard to Splunk UI:

```bash
npm run publish:dashboard -- --mode mcp
```

From the VS Code panel, use `Publish to Splunk` after `Generate + Run SPL` to publish the current verified dashboard and disabled alert through Splunk REST.

CLI equivalent:

```bash
npm run publish:app -- --mode mcp
```

Open:

```text
http://localhost:8000/app/search/failed_login_dashboard
```

If Splunk adds locale:

```text
http://localhost:8000/en-GB/app/search/failed_login_dashboard
```

Export generated app folder:

```bash
npm run export:app -- --mode mcp
```

Expected output:

```text
Exported Splunk app folder: .../exports/spl-forge-generated-app
Files: 6
Rows verified before export: 12
```

## Troubleshooting

### `ERR_SSL_PROTOCOL_ERROR` on port 8000

Use HTTP for Splunk Web:

```text
http://localhost:8000/app/search/failed_login_dashboard
```

Use HTTPS for Splunk management API:

```text
https://localhost:8089
```

### Dashboard loads but shows no results

Republish dashboard:

```bash
npm run publish:dashboard -- --mode mcp
```

Expected publisher output includes:

```text
Published search: index=main sourcetype=auth latest=now | rex field=_raw ...
Rows verified before publish: 12
```

If published search does not include `rex field=_raw`, the dashboard is using stale XML.

### MCP auth fails

Check:

- endpoint is copied from MCP Server app
- token is encrypted MCP token, not direct REST token
- user role has `mcp_tool_execute`
- token has not expired
- MCP tool is enabled server-side

### REST publish fails

Check:

- `SPL_FORGE_SPLUNK_URL`
- `SPL_FORGE_SPLUNK_USERNAME`
- `SPL_FORGE_SPLUNK_PASSWORD`
- `SPL_FORGE_SPLUNK_TOKEN`
- `SPL_FORGE_SPLUNK_ALLOW_SELF_SIGNED`

Dashboard publish needs direct Splunk REST credentials even when search execution uses MCP.

## Security Notes

- Never commit `.env.local`.
- Never commit MCP tokens.
- Keep MCP token and REST token separate.
- Prefer least-privilege roles.
- Disable privileged tools server-side if not needed.
- Avoid self-signed TLS bypass in production.
- Treat global MCP key invalidation as disruptive.
- Keep generated alerts disabled until reviewed.

## Beta Features To Treat Carefully

| Feature | Status | SPL Forge position |
| --- | --- | --- |
| `splunk_run_saved_search` | Beta in MCP Server 1.1.x | Future enhancement only. |
| MCP Server rate limiting | Beta in MCP Server 1.1.x | Admin-controlled; plan for tool errors. |
| OAuth 2.1 MCP Server | Controlled access | Future enterprise path. |
| Observability MCP Gateway | Cloud/regional availability | Outside the current release scope. |

## Release Checklist

Before walkthrough or release validation:

- Splunk Enterprise or Cloud available.
- Developer License applied for local Enterprise validation.
- Failed-login CSV fixture imported.
- Splunk MCP Server app installed.
- API access enabled.
- Token auth enabled.
- User role has `mcp_tool_execute`.
- Encrypted MCP token generated.
- `.env.local` configured.
- `npm run verify:splunk -- --mode all` passes.
- Panel prompt returns rows.
- `npm run publish:dashboard -- --mode mcp` publishes dashboard.
- Splunk UI dashboard shows chart/table rows.
- `npm run export:app -- --mode mcp` writes importable app folder.

## Related Docs

- [`SPLUNK_SETUP.md`](./SPLUNK_SETUP.md)
- [`FREE_TRIAL_SETUP.md`](./FREE_TRIAL_SETUP.md)
- [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`WALKTHROUGH_RUNBOOK.md`](./WALKTHROUGH_RUNBOOK.md)
- [`PROGRESS.md`](./PROGRESS.md)
