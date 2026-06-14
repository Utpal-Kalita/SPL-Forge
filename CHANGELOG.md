# Changelog

All notable SPL Forge changes are summarized here.

## [0.0.1] - 2026-05-25

### Added

- VS Code extension panel for prompt input, generated SPL, execution summary, repair history, and artifact previews.
- Standalone browser dashboard via `npm run dashboard`.
- Splunk-hosted-model generation path through MCP AI Assistant tooling or a direct Splunk model endpoint.
- MCP and REST Splunk execution adapters.
- Schema inspection for indexes, sourcetypes, fields, and execution messages.
- Self-debugging repair loop for common index, sourcetype, field alias, action value, and time-window issues.
- Dashboard Studio JSON and classic XML dashboard artifact generation.
- Disabled saved-search alert preview and publish path.
- Splunk app folder export with `app.conf`, dashboard XML, saved searches, metadata, README, manifest, and CSV extraction stanzas.
- REST publish flow for dashboard plus disabled alert, including endpoint reloads.
- Prompt verification suite for authentication, trend, threshold, source-IP, successful-login, risk, MFA, privileged-action, service-account, and unsafe-output cases.
- Release verification command via `npm run verify:release`.
- Product documentation for setup, architecture, local Splunk configuration, sample data, roadmap, and walkthrough validation.

### Changed

- Third-party API-key model providers were removed from active configuration.
- Splunk model provider now uses Splunk MCP AI Assistant tooling or a Splunk-hosted model endpoint.
- Local CSV-backed validation queries are rewritten with `rex` extraction and header filtering when search-time field extraction is unavailable.
- Published dashboard searches use the verified executable query rather than display-only SPL.
- Repository documentation now presents SPL Forge as a product repository with release and validation language.

### Known Gaps

- Full Splunk app install automation is not implemented yet.
- App archive packaging is still pending.
- True separate multi-agent runtime is not implemented yet.
- Human approval controls before provider-backed repair auto-rerun need more polish.
- Generated app validation before import should be expanded.
