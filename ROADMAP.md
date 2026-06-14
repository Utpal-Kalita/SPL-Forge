# SPL Forge Roadmap

> Implementation status: this roadmap includes product ambition beyond the current code. Current repository implementation includes a VS Code webview, a standalone browser dashboard, a working Splunk-hosted-model path through MCP AI Assistant tooling or a direct Splunk model endpoint, MCP/REST/mock Splunk execution, app-folder export, and dashboard/disabled-alert REST publish. Full app install automation and a true separate sub-agent runtime are not implemented yet.

## Executive Summary

SPL Forge is an AI-powered development workspace for Splunk. It turns natural-language requirements into working SPL searches, dashboards, alerts, and app-ready artifacts. The core product loop is:

```text
Intent -> Generate SPL -> Execute -> Inspect -> Repair -> Preview -> Export
```

The near-term roadmap focuses on making that loop reliable, safe, and useful in a real Splunk environment. Later phases expand SPL Forge into a broader agentic development layer for Splunk teams.

## Current Release

The repository currently supports:

- VS Code webview workflow for prompt, generated SPL, execution summary, repair history, and artifact preview.
- Standalone browser dashboard via `npm run dashboard`.
- Splunk-hosted-model generation through MCP AI Assistant tooling or a direct Splunk model endpoint.
- Splunk execution through MCP or REST, with mock mode for offline tests.
- Schema-aware repair loop for common index, sourcetype, field, action, and time-window issues.
- Dashboard Studio JSON and classic XML generation.
- Disabled alert saved-search preview and publish path.
- Local Splunk app folder export with app metadata and validation sourcetype extraction config.
- REST publish for dashboard plus disabled alert, including endpoint reloads.

## Product Goals

- Reduce the time required to create useful Splunk searches, dashboards, and alerts.
- Make SPL development accessible without removing expert review.
- Improve trust in generated SPL by testing it against real Splunk feedback.
- Keep users in control before execution, export, and publish actions.
- Provide a clean developer workflow that fits VS Code and Splunk operating practices.

## Phase 1: Harden The Core Loop

Focus: turn the current implementation into a dependable release workflow.

- Add app archive packaging and optional install endpoint automation.
- Add explicit human approval controls before provider-backed repair auto-rerun.
- Add richer validation for generated app files before import.
- Improve error reporting for MCP, REST, model, and publish failures.
- Expand prompt verification beyond authentication examples.
- Keep release verification under `npm run verify:release`.

## Phase 2: Better Developer Experience

Focus: make SPL Forge feel like a daily Splunk development tool.

- Add syntax-highlighted SPL editor and editable generated artifacts.
- Add reusable prompt templates for common observability, security, and platform workflows.
- Add query and artifact history for the current workspace.
- Add side-by-side diffs for repaired SPL and generated app files.
- Improve dashboard and alert preview ergonomics.
- Add clearer configuration UI for MCP and REST modes.

## Phase 3: Team Workflow Integration

Focus: support repeatable team usage.

- Add Git integration for generated Splunk app changes.
- Add CI validation for exported app folders.
- Add team-level prompt libraries and safety policies.
- Add audit logs for generated, executed, repaired, exported, and published artifacts.
- Add integration points for Jira, Slack, or ServiceNow handoff.
- Add organization-level configuration profiles.

## Phase 4: Enterprise And Ecosystem

Focus: broaden SPL Forge into an extensible Splunk development platform.

- Add a plugin model for custom generators, validators, and publishers.
- Support multiple Splunk environments and deployment profiles.
- Add enterprise authentication and role-aware controls.
- Add marketplace-ready templates for common Splunk workflows.
- Add true specialized-agent runtime only when the core workflow needs that separation.
- Explore Splunkbase packaging and broader distribution.

## Success Metrics

- Generated searches that run successfully after zero or one repair attempt.
- Time from prompt to validated dashboard or alert artifact.
- Number of reusable workflows created by teams.
- Rate of manual changes required before export or publish.
- User confidence in generated SPL and artifact explanations.
- Reliability of MCP/REST execution and publish operations.

## Technical Direction

SPL Forge should continue to use:

- TypeScript and Node.js for the VS Code extension and local CLI tooling.
- Splunk MCP Server as the preferred agent-to-Splunk bridge.
- Splunk REST API for fallback execution and write-style publish operations.
- Splunk-hosted model paths for SPL generation and repair.
- Local `.env.local` configuration for development, with secrets kept out of Git.
- Focused validators and deterministic repair rules before relying on model repair.

## Reality Check

- Complete Splunk app install automation is not implemented yet.
- True multi-agent runtime is not implemented yet.
- Mock mode exists for local tests and offline workflows, but release verification should use live MCP or REST execution.
- Generated alerts are disabled by default until reviewed.
- The product should not claim a query works unless it was executed or clearly marked as untested.
