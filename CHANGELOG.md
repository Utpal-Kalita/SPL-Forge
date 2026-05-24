# Changelog

All notable changes to **SPL FORGE** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Project status:** SPL FORGE is currently a pre-release hackathon project for the Splunk Agentic Ops Hackathon 2026. Until a public repository is tagged, version numbers represent documented product, architecture, and implementation milestones.

---

## [Unreleased]

### Added

- Implementation backlog for the first working SPL FORGE MVP.
- Frontend workspace for natural-language operational requests, SPL preview, validation results, execution status, generated artifacts, and approval prompts.
- SPL editor experience using Monaco Editor or an equivalent code editor with syntax highlighting, copy/export actions, and before/after query comparison.
- Backend API routes for the core forge pipeline:
  - `POST /api/intent/analyze`
  - `POST /api/spl/generate`
  - `POST /api/spl/validate`
  - `POST /api/spl/execute`
  - `POST /api/spl/optimize`
  - `POST /api/artifacts/dashboard`
  - `POST /api/artifacts/alert`
  - `POST /api/artifacts/runbook`
  - `GET /api/jobs/:jobId`
  - `GET /api/splunk/metadata`
- Splunk MCP adapter layer for search execution, search result retrieval, index discovery, sourcetype discovery, field discovery, saved-search discovery, and dashboard discovery.
- Initial MCP gateway design for connecting multiple tool servers without tightly coupling every agent directly to each integration.
- Prompt templates for intent classification, SPL generation, SPL validation, SPL optimization, incident analysis, dashboard generation, alert generation, and runbook generation.
- Structured response schemas for generated SPL, validation warnings, risk levels, execution metadata, optimized SPL, artifact recommendations, and final user-facing explanations.
- Local development plan using Docker Compose for the web app, API server, Redis queue, optional PostgreSQL state store, and MCP-related services.
- Example demo scenarios for observability, security, platform engineering, and developer productivity:
  - Checkout latency spike investigation.
  - Failed-login spike detection.
  - Kubernetes pod restart monitoring.
  - Conversion of vague investigation questions into multiple SPL searches.
- Test fixture plan for synthetic logs, security authentication events, application latency events, deployment events, and Kubernetes events.
- Audit-log event model for recording user prompts, generated SPL, validation results, approval decisions, executed searches, generated artifacts, and exported assets.
- Product telemetry plan to send SPL FORGE usage and safety events back into Splunk for self-observability.
- Human approval workflow for high-risk actions such as running broad searches, creating alerts, modifying saved searches, writing Splunk app files, sending notifications, or creating tickets.
- Documentation tasks for `README.md`, `SETUP.md`, `DEMO.md`, `SECURITY.md`, `ARCHITECTURE.md`, and `CONTRIBUTING.md`.

### Changed

- Refined the project direction from a single-purpose SPL generator into a full lifecycle **agentic Splunk operations workbench**.
- Expanded the product scope to cover SPL generation, explanation, validation, execution, optimization, dashboard creation, alert creation, runbook generation, incident timelines, and Splunk app scaffolding.
- Prioritized a safe, human-in-the-loop agent workflow over fully autonomous production changes.
- Standardized the project around the term **forge pipeline**, where every generated operational artifact is drafted, validated, tested, explained, optimized, and packaged before use.
- Shifted the MVP authentication plan toward token-based Splunk authentication because Splunk MCP OAuth support is still treated as a later-stage capability.
- Reframed the system as a multi-track hackathon submission that can align with Observability, Security, and Platform instead of being limited to one category.

### Fixed

- Clarified that SPL FORGE should not pretend a query is correct when Splunk returns empty, weak, or suspicious results.
- Clarified that generated SPL must be environment-aware and should use actual indexes, sourcetypes, fields, saved searches, dashboards, lookups, macros, and knowledge objects when available.
- Clarified that broad, expensive, or risky SPL searches should be flagged before execution.
- Clarified that generated alerts and dashboards should remain drafts until reviewed or approved by a human user.

### Security

- Added planned least-privilege MCP role separation:
  - Read-only search role.
  - Metadata discovery role.
  - Saved-search author role.
  - Dashboard author role.
  - Admin-only deployment role.
- Added planned SPL safety scanner rules for missing index constraints, overly broad time ranges, leading wildcards, expensive joins, risky commands, sensitive field exposure, and high-cardinality aggregations.
- Added planned approval gates for production-impacting actions.
- Added planned audit logging for every agent decision and Splunk operation.
- Added planned PII and sensitive-field handling rules before query execution and artifact export.

---

## [0.4.0] - 2026-05-24

### Added

- Created the detailed `ABOUT.md` product specification for SPL FORGE.
- Documented SPL FORGE as an agentic Splunk operations workbench that turns natural-language operational intent into safe, validated, production-ready Splunk assets.
- Added the complete nine-stage forge pipeline:
  - Intent capture.
  - Context discovery.
  - SPL drafting.
  - Static validation.
  - Controlled execution through Splunk MCP Server.
  - Result analysis.
  - Query optimization.
  - Artifact generation.
  - Human review and approval.
- Added the main feature set:
  - Natural language to SPL.
  - SPL explainer.
  - SPL safety scanner.
  - SPL optimizer.
  - Agentic incident investigation.
  - Alert and detection builder.
  - Dashboard Forge.
  - Runbook generator.
  - Splunk app builder.
  - Knowledge object reuse.
- Added detailed explanation of how SPL FORGE uses Splunk:
  - Splunk Enterprise or Splunk Cloud as the operational data platform.
  - SPL Search Engine as the execution layer.
  - Splunk MCP Server as the secure agent-to-Splunk bridge.
  - Splunk AI Assistant for SPL as a helper for SPL generation, editing, explanation, and refinement.
  - Splunk AI Toolkit for anomaly detection, forecasting, clustering, classification, and custom ML workflows.
  - Splunk Hosted Models for security reasoning, time-series analysis, alert enrichment, and incident summarization.
  - Splunk Python SDK and app framework for packaging SPL FORGE capabilities inside Splunk.
- Added the modular MCP server architecture:
  - Splunk MCP Server.
  - Documentation MCP Server.
  - GitHub MCP Server.
  - Ticketing MCP Server.
  - CI/CD MCP Server.
  - Notification MCP Server.
- Added agent responsibilities for:
  - Intent Agent.
  - Schema Discovery Agent.
  - SPL Generator Agent.
  - Validator Agent.
  - Execution Agent.
  - Analyst Agent.
  - Optimizer Agent.
  - Artifact Agent.
- Added recommended tech stack:
  - React or Next.js.
  - TypeScript.
  - Tailwind CSS.
  - Monaco Editor.
  - Recharts or Apache ECharts.
  - Python FastAPI or Node.js/NestJS.
  - LangGraph, OpenAI Agents SDK, or similar orchestration framework.
  - Pydantic or Zod for schema validation.
  - Redis for queues and short-lived cache.
  - PostgreSQL for app state.
  - Docker and Docker Compose for local development.
  - GitHub Actions for CI.
  - OpenTelemetry and Splunk ingestion for self-monitoring.
- Added core data flow from user prompt to final Splunk artifact.
- Added security and safety model covering human approval, query guardrails, least-privilege MCP access, and audit logging.
- Added scalability plan covering stateless APIs, async search execution, job queues, environment-aware caching, and multi-tenant design.
- Added example use cases across Observability, Security, Platform Engineering, and Developer Productivity.
- Added recommended demo flow for a checkout latency spike investigation after a deployment.
- Added proposed repository structure for apps, agents, MCP servers, Splunk app files, guardrails, prompts, tests, and local configuration.
- Added sample `.env` configuration for Splunk, MCP, OpenAI, Redis, and database connections.
- Added example API design for intent analysis, SPL generation, validation, execution, optimization, and artifact creation.
- Added example agent output JSON showing intent, risk level, generated SPL, explanation, validation warnings, and recommended artifacts.
- Added originality statement explaining the **forge model** as the main differentiator.
- Added future product vision for team workspaces, approval workflows, version control for SPL assets, regression tests, GitHub pull requests, Jira, ServiceNow, Slack, PagerDuty, RBAC, policy packs, marketplace recipes, and continuous learning from past incidents.
- Added success metrics for time saved, query quality, incident speed, alert quality, artifact approval rate, and user trust.

### Changed

- Expanded SPL FORGE from a concept into a complete product architecture.
- Repositioned the project from “AI that writes SPL” to “AI that operationalizes Splunk workflows.”
- Changed the system design to require real Splunk environment context before generating final SPL.
- Changed generated assets from one-off outputs into reviewable, exportable, and versionable artifacts.
- Changed the safety posture from passive warnings to an explicit validation and approval model.
- Changed the Splunk MCP Server role from an optional integration to the core controlled execution bridge.

### Security

- Added human approval requirements before creating alerts, modifying saved searches, writing to Splunk KV Store, creating tickets, sending notifications, or running broad searches.
- Added validation checks for risky SPL patterns before any controlled execution.
- Added audit logging as a first-class design requirement.
- Added least-privilege MCP access as the default permission model.

---

## [0.3.0] - 2026-05-24

### Added

- Completed research phase for the Splunk Agentic Ops Hackathon 2026.
- Added hackathon timeline awareness:
  - Registration period.
  - Submission period.
  - Feedback period.
  - Judging period.
  - Winner announcement window.
- Added eligibility and team-size awareness for planning the submission.
- Added judging criteria alignment:
  - Technological implementation.
  - Design.
  - Potential impact.
  - Quality of the idea.
- Added prize and track context for shaping the project strategy.
- Added project-track mapping for Observability, Security, and Platform.
- Added technology inventory for the Splunk AI ecosystem:
  - AI for Splunk Apps.
  - Splunk MCP Server.
  - Splunk AI Assistant for SPL.
  - Splunk AI Toolkit.
  - Splunk Hosted Models.
  - Splunk Python SDK.
  - Splunk app framework.
- Added Splunk access plan:
  - Create a free Splunk account.
  - Install the Splunk Enterprise free trial.
  - Request a Splunk Developer License.
  - Use token-based authentication for MCP-based development.
- Added resource plan for using official Splunk documentation, Splunkbase apps, MCP configuration guides, AI Assistant setup guides, AI Toolkit resources, and hosted model references.
- Added support-channel awareness for the Splunk Community Slack and the hackathon channel.
- Added initial ecosystem strategy for building a scalable product rather than only a narrow hackathon demo.

### Changed

- Shifted the research focus from collecting project ideas to understanding the Splunk platform, hackathon rules, available AI capabilities, and high-value integration areas.
- Prioritized Splunk-native capabilities over unrelated external tooling.
- Prioritized agentic workflows that can be demonstrated inside or alongside Splunk.
- Prioritized solutions that improve operational teams’ real workflows: monitoring, detection, investigation, response, and Splunk app development.

### Security

- Identified MCP access control and authentication as a major design concern.
- Identified token-based authentication as the practical MVP route for Splunk MCP integration.
- Identified OAuth support as a future enhancement once broader availability matures.

---

## [0.2.0] - 2026-05-24

### Added

- Added the project identity **SPL FORGE**.
- Added the core brand metaphor: a forge that turns rough operational intent into production-grade Splunk intelligence.
- Added the product positioning as a professional-level agentic operations platform for Splunk users.
- Added the short submission-ready project description under 350 characters.
- Added early branding direction for a logo and visual identity.
- Added initial narrative around making the project original, scalable, and enterprise-ready.
- Added the idea that SPL FORGE should generate more than SPL queries, including dashboards, alerts, detections, runbooks, reports, and app components.

### Changed

- Changed the project framing from a generic AI hackathon idea to a named, branded product concept.
- Changed the output goal from a simple demo to a polished professional submission with product story, architecture, and growth path.
- Changed the pitch to emphasize developer productivity, observability, security, platform extensibility, and Splunk-native workflows.

---

## [0.1.0] - 2026-05-24

### Added

- Started the SPL FORGE project exploration inside the Splunk Agentic Ops Hackathon context.
- Added the initial requirement to deeply research:
  - Hackathon rules.
  - Tools.
  - Technologies.
  - Splunk platform capabilities.
  - Possible integration areas.
  - Product scalability around the Splunk ecosystem.
- Added the requirement to create something original rather than a common or low-effort hackathon clone.
- Added the requirement to avoid premature project ideas until the platform research was complete.
- Added the ambition level for a highly complex, professional-grade project.

### Changed

- Established the project’s direction as research-first and architecture-first.
- Established that the project should be capable of growing beyond the hackathon into a scalable product.
- Established that the project should use current Splunk AI capabilities instead of treating Splunk as only a log-search database.

---

## [0.0.1] - 2026-05-24

### Added

- Created the initial project workspace for Splunk Agentic Ops Hackathon planning.
- Added source context files for:
  - Hackathon rules.
  - Hackathon resources.
  - Challenge overview.
- Added the first project direction: use AI and Splunk together to improve observability, security, platform operations, and developer productivity.

---

## Release Notes Policy

SPL FORGE changelog entries should remain useful to builders, judges, maintainers, and future users. Each release should describe what changed at the product, architecture, implementation, documentation, and safety levels.

Recommended categories:

- `Added` for new features, docs, architecture, APIs, agents, integrations, demo flows, and assets.
- `Changed` for updates to product direction, architecture, workflows, dependencies, or user experience.
- `Deprecated` for features or APIs that will be removed later.
- `Removed` for deleted features, files, integrations, or abandoned approaches.
- `Fixed` for corrections to docs, prompts, SPL generation behavior, validation rules, or UI/API bugs.
- `Security` for guardrails, authentication, authorization, audit logging, PII handling, MCP permissions, and safe execution changes.

## Versioning Policy

Before the first production release, SPL FORGE uses `0.x.y` versions:

- `0.0.x` for initial setup and repository preparation.
- `0.1.x` for research and concept definition.
- `0.2.x` for branding, pitch, and submission narrative.
- `0.3.x` for hackathon ecosystem research and track alignment.
- `0.4.x` for architecture and documentation.
- `0.5.x` for first working MVP implementation.
- `0.6.x` for Splunk MCP integration.
- `0.7.x` for dashboard, alert, and runbook generation.
- `0.8.x` for security hardening and test coverage.
- `0.9.x` for demo polish and submission readiness.
- `1.0.0` for the first stable release after the hackathon prototype is validated.

## Future Release Targets

### [0.5.0] - MVP Workspace

Planned scope:

- Working frontend.
- Working backend API.
- Intent analysis endpoint.
- SPL generation endpoint.
- SPL validation endpoint.
- Local state model.
- Basic approval UI.
- Example generated SPL explanations.

### [0.6.0] - Splunk MCP Integration

Planned scope:

- Splunk MCP Server connection.
- Token-based authentication.
- Metadata discovery.
- Controlled SPL execution.
- Search result retrieval.
- Job status polling.
- MCP error handling.

### [0.7.0] - Artifact Forge

Planned scope:

- Dashboard draft generation.
- Alert draft generation.
- Runbook draft generation.
- Incident timeline generation.
- Splunk app file scaffolding.
- Exportable Markdown and JSON artifacts.

### [0.8.0] - Guardrails and Quality

Planned scope:

- Expanded SPL safety scanner.
- Query cost heuristics.
- Sensitive-field detection.
- Approval policy configuration.
- Audit-log ingestion into Splunk.
- Unit tests for agents and validators.
- Integration tests against a local Splunk environment.

### [0.9.0] - Hackathon Submission Candidate

Planned scope:

- Final demo script.
- Final project description.
- Final screenshots or video assets.
- Deployment instructions.
- Security notes.
- Judge-facing explanation of technical implementation, design, potential impact, and originality.
- Clean repository structure and reproducible setup.

[Unreleased]: https://github.com/your-org/spl-forge/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/your-org/spl-forge/releases/tag/v0.4.0
[0.3.0]: https://github.com/your-org/spl-forge/releases/tag/v0.3.0
[0.2.0]: https://github.com/your-org/spl-forge/releases/tag/v0.2.0
[0.1.0]: https://github.com/your-org/spl-forge/releases/tag/v0.1.0
[0.0.1]: https://github.com/your-org/spl-forge/releases/tag/v0.0.1
