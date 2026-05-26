# Changelog

All notable changes to **SPL Forge** will be documented in this file.

> **Project status:** SPL Forge is pre-release hackathon project for Splunk Agentic Ops Hackathon 2026. Foundation setup, prompt flow, query generation, and MCP/REST/mock Splunk execution plumbing are complete. Repair loop and artifact export stages remain in progress.

---

## [Unreleased]

### Added

- VS Code extension scaffold with TypeScript and esbuild configuration.
- Extension activation command infrastructure: `spl-forge.openPanel` for launching the assistant panel.
- First working webview panel scaffold in `src/panels/assistant.ts`.
- Day 2 prompt submission flow from panel to extension runtime.
- `.env.local`-aware runtime config loader in `src/config/env.ts`.
- LLM generation adapter in `src/agent/generate.ts` with:
  - OpenAI chat completions support
  - Anthropic messages API support
  - deterministic mock fallback when API credentials are absent
- Raw provider output and parsed SPL rendering inside webview panel.
- Query plan summary returned from generation pipeline and rendered in panel.
- Intent parser in `src/agent/generate.ts` for:
  - artifact classification (`search`, `dashboard`, `alert`, `dashboard+alert`)
  - breakdown detection (`country`, `user_agent`, `user`, `src`)
  - focus-field inference for aggregation defaults
  - threshold and threshold-window extraction
  - relative-time parsing for `last`, `past`, `previous`, `today`, and `yesterday`
- Schema-aware LLM prompt construction using known failed-login demo fields and Splunk defaults.
- Deterministic mock SPL builder for:
  - dashboard-style grouped searches
  - threshold alert searches
  - time-trend searches
  - success and failure login prompt variants
- Splunk execution adapter in `src/splunk/execute.ts` with:
  - deterministic mock execution mode
  - MCP execution mode for `splunk_run_query`
  - MCP preflight support for `splunk_get_info`
  - REST execution mode for `/services/search/jobs/export`
  - local trial fixture rewrite for CSV-backed auth searches
  - automatic `earliest=0` retry for stale demo timestamps
  - result rows, field collection, messages, elapsed time, and error status
- Runtime config for Splunk execution:
  - `SPL_FORGE_SPLUNK_MODE`
  - `SPL_FORGE_SPLUNK_MCP_ENDPOINT`
  - `SPL_FORGE_SPLUNK_MCP_TOKEN`
  - `SPL_FORGE_SPLUNK_MCP_ALLOW_SELF_SIGNED`
  - `SPL_FORGE_SPLUNK_URL`
  - `SPL_FORGE_SPLUNK_TOKEN`
  - `SPL_FORGE_SPLUNK_USERNAME`
  - `SPL_FORGE_SPLUNK_PASSWORD`
  - `SPL_FORGE_SPLUNK_SEARCH_LIMIT`
  - `SPL_FORGE_SPLUNK_ALLOW_SELF_SIGNED`
- `.env.example` with LLM and Splunk execution settings.
- SPL Forge output channel logging for prompt, provider, raw response, and parsed SPL.
- Build pipeline with esbuild for fast bundling and development watch mode.
- Development tools stack: TypeScript (5.9.3), ESLint (9.39.3), npm-run-all for parallel task execution.
- Testing framework setup with VS Code test CLI and Mocha support.
- Type definitions for VS Code API, Node.js, and Mocha testing framework.
- Extended unit coverage for:
  - intent parsing
  - threshold alert shaping
  - trend query shaping
  - relative-time parsing
  - structured mock SPL generation
  - mock Splunk execution
  - independent local REST Splunk execution
  - independent local MCP JSON-RPC execution
  - REST missing-credential handling
  - MCP missing-configuration handling
- VS Code SecretStorage API integration ready for secure token management.
- Documentation structure and initial guides:
  - QUICKSTART.md for first-time setup
  - VS_CODE_SETUP.md for extension development environment
  - FREE_TRIAL_SETUP.md for Splunk Enterprise free trial + Developer License path
  - SAMPLE_DATA.md for Day 1 data import flow
  - DAY1_STATUS.md for roadmap checkpoint status
  - SPLUNK_SETUP.md for Splunk connectivity prerequisites
  - ARCHITECTURE.md for system design overview
  - DEMO_RUNBOOK.md for demo scenario walkthrough
  - PROGRESS.md for development tracking
- Extension configuration in package.json with proper contribution points.
- Build scripts for development, testing, and production packaging.
- Git configuration with .gitignore and .vscodeignore for clean version control and packaging.
- Sample failed-login fixture in `samples/failed_login_auth.csv`.
- Workspace recommendation for official `Splunk.splunk` VS Code extension.
- GitHub Actions CodeQL workflow for TypeScript security and quality scanning.
- GitHub Actions npm dependency audit workflow for high-severity production dependency checks on pull requests.
- GitHub Actions VSIX packaging workflow that uploads extension package artifacts from CI.
- GitHub Actions Markdown link check workflow for documentation health.
- GitHub Actions Gitleaks workflow for committed secret scanning.
- Dependabot configuration for weekly npm and GitHub Actions update pull requests.
- Live Splunk verification CLI via `npm run verify:splunk` for REST and MCP smoke tests against real data.
- Day 5 self-debugging workflow for generate -> execute -> schema inspect -> repair -> rerun.
- Schema inspection helper for field, index, sourcetype, and probe-message summaries.
- Deterministic repair rules for common failed-login demo mistakes across index, sourcetype, field aliases, action values, and time windows.
- Repair history rendering in the VS Code panel and SPL Forge output channel.
- Root `architecture_diagram.md` for hackathon submission requirements.
- MIT license declaration for open-source submission readiness.
- LLM SPL normalization guardrail that strips non-search artifact commands and falls back to safe primary dashboard SPL when provider output is malformed.
- CodeQL workflow fallback artifact upload for repositories without code scanning enabled.

### In Progress (Planned for next milestone)

- Backend API routes for the forge pipeline (intent analysis, SPL generation, validation, execution, optimization, artifact generation).
- Agent orchestrator for multi-stage workflow (Intent → Generate → Validate → Execute → Repair → Optimize → Package).
- LLM provider abstraction for OpenAI, Anthropic, or Splunk Hosted Models.
- Schema service for caching and discovering Splunk metadata (indexes, sourcetypes, fields).
- Self-debugging repair loop with error detection and automatic query correction.
- Result preview and visualization support.
- Artifact generators:
  - Dashboard XML/JSON generation
  - Alert configuration generation
  - Saved search creation
  - Splunk app scaffolding
- Webview UI for VS Code extension with:
  - Natural language prompt input
  - Agent activity timeline
  - SPL editor/output display
  - Results preview panel
  - Artifact export interface

### Changed

- Repositioned from monolithic design concept to modular, MVP-focused VS Code extension approach.
- Standardized development stack on TypeScript and Node.js for consistency with VS Code ecosystem.
- Shifted authentication strategy toward token-based approach with VS Code SecretStorage for security.
- Replaced Docker-first local setup path with Splunk Enterprise free trial + Developer License flow.
- Upgraded panel from static Day 1 status view to interactive Day 2 prompt/response workspace.
- Upgraded panel again from raw Day 2 prompt/response view to Day 3 query-planning workspace with interpreted intent summary.
- Upgraded panel to run generated SPL and render execution summary plus result preview.
- Added Splunk MCP Server path as first-class execution mode, with REST and mock kept as fallbacks.
- Replaced generic mock SPL output with prompt-aware Splunk-shaped query synthesis for demo data.
- Tightened provider prompts so model requests include explicit schema hints and primary-query constraint for dashboard+alert prompts.

### Fixed

- Clarified that the extension should gracefully handle missing Splunk configuration with helpful error messages.
- Corrected docs and repo guidance to reflect Day 1 scaffold status instead of pure planning-only state.
- Corrected mock query defaults from `sourcetype=csv` to `sourcetype=auth` to match sample fixture and docs.
- Fixed mismatch between repo status docs and actual implementation stage by marking query-generation work complete.
- Fixed quickstart and progress docs so they reflect implemented extension, generation, and execution work.
- Fixed MCP/REST retry flow so zero-row first pass can retry widened time range instead of returning early.
- Fixed local self-hosted trial auth searches by rewriting CSV-backed demo queries into working `rex` + `where` pipelines.
- Fixed opaque localhost network failures so nested socket errors surface in adapter messages.
- Fixed documentation links from `docs/` pages to root-level `PRD.md` and `ROADMAP.md` so Markdown link checks pass.
- Fixed GitHub Actions dependency scanning by replacing unsupported Dependency Review usage with portable `npm audit`.
- Fixed TypeScript type resolution robustness by explicitly including Node and Mocha ambient types.

### Verified

- Confirmed live REST mode against real Splunk data with `npm run verify:splunk -- --mode rest`.
- Confirmed live MCP mode against real Splunk data with `npm run verify:splunk -- --mode mcp`.
- Confirmed combined live REST+MCP verification with `npm run verify:splunk -- --mode all`.
- Confirmed same backend workflow used by the panel with live Groq and Splunk config returns 12 rows for the failed-login dashboard prompt.

### Security

- Established VS Code SecretStorage as the mechanism for secure token and credential storage (no plaintext files).
- Planned least-privilege MCP role architecture for Splunk connectivity.

### Manual Milestones

- Installed local Splunk Enterprise free trial.
- Installed official `Splunk.splunk` VS Code extension.
- Requested and applied Splunk Developer License.

---

## [0.4.0] - 2026-05-24

### Added

- Comprehensive product specification in `ABOUT.md` detailing SPL Forge as an agentic Splunk operations workbench.
- Complete nine-stage forge pipeline architecture:
  - Intent capture from natural language
  - Context discovery via Splunk metadata
  - SPL drafting with LLM assistance
  - Static validation before execution
  - Controlled execution through Splunk MCP Server
  - Result analysis and quality assessment
  - Query optimization for production use
  - Artifact generation (dashboards, alerts, runbooks, apps)
  - Human review and approval workflows
- Feature set documentation:
  - Natural language to SPL conversion
  - SPL explainer and documentation generation
  - SPL safety scanner for risk detection
  - SPL optimizer for performance improvements
  - Agentic incident investigation workflows
  - Alert and detection rule builder
  - Dashboard generation ("Dashboard Forge")
  - Runbook and operational guide generator
  - Splunk app builder for packaging
  - Knowledge object discovery and reuse
- Detailed explanation of Splunk platform integration:
  - Splunk Enterprise/Cloud as operational data platform
  - SPL Search Engine as execution layer
  - Splunk MCP Server as secure agent-to-Splunk bridge
  - Splunk AI Assistant for SPL generation and refinement
  - Splunk AI Toolkit for advanced analytics
  - Splunk Hosted Models for specialized reasoning tasks
  - Splunk Python SDK for app development
- Modular MCP server architecture design:
  - Primary: Splunk MCP Server (search, metadata, knowledge objects)
  - Secondary: Documentation MCP Server (runbooks, procedures)
  - Secondary: GitHub MCP Server (repo inspection, PR generation)
  - Secondary: Ticketing MCP Server (incident creation)
  - Secondary: CI/CD MCP Server (deployment correlation)
  - Secondary: Notification MCP Server (alert distribution)
- Agent specialization design with 8 distinct agent responsibilities:
  - Intent Agent for goal classification
  - Schema Discovery Agent for metadata introspection
  - SPL Generator Agent for query drafting
  - Validator Agent for safety/syntax checking
  - Execution Agent for search execution
  - Analyst Agent for result interpretation
  - Optimizer Agent for performance tuning
  - Artifact Agent for asset generation
- Recommended tech stack documentation:
  - Frontend: React/Next.js, TypeScript, Tailwind CSS, Monaco Editor, Recharts/ECharts
  - Backend: Python FastAPI or Node.js/NestJS
  - Orchestration: LangGraph or OpenAI Agents SDK
  - Validation: Pydantic or Zod schemas
  - Queue/Cache: Redis
  - State: PostgreSQL
  - Local Splunk development environment using Splunk Enterprise free trial + Developer License
  - CI: GitHub Actions
  - Observability: OpenTelemetry + Splunk ingestion
- Core data flow documentation from user prompt to final Splunk artifact.
- Security and safety model covering:
  - Human-in-the-loop approval gates
  - Query guardrails and validation rules
  - Least-privilege MCP access control
  - Audit logging for compliance
  - PII and sensitive field handling
- Scalability plan with:
  - Stateless API design for horizontal scaling
  - Async search execution with job queues
  - Environment-aware metadata caching
  - Multi-tenant isolation support
- Use case examples across four domains:
  - Observability: latency investigation and dashboards
  - Security: detection engineering and threat hunting
  - Platform Engineering: Splunk app generation and governance
  - Developer Productivity: query generation and refinement
- Demo flow blueprint for checkout latency investigation scenario.
- Proposed repository structure for production-ready codebase organization.
- Sample .env configuration template for Splunk, MCP, OpenAI, Redis, and database settings.
- Example API design specification with request/response schemas.
- Agent output JSON examples showing expected data structures.
- Originality statement explaining the "forge model" as core differentiator.
- Future vision document covering:
  - Team workspaces and collaboration features
  - Version control for SPL assets
  - Regression testing for saved searches
  - GitHub and CI/CD integration
  - Jira, ServiceNow, Slack, PagerDuty connectors
  - RBAC and policy packs
  - Enterprise audit logging
  - Marketplace for reusable workflows
  - Continuous learning from incident history
- Success metrics framework for:
  - Time savings measurement
  - Query quality scoring
  - Incident investigation acceleration
  - Alert accuracy improvement
  - Artifact approval rates
  - User trust indicators

### Changed

- Expanded project scope from single-purpose "SPL generator" to full-lifecycle "agentic Splunk operations workbench".
- Repositioned product narrative from "AI that writes SPL" to "AI that operationalizes Splunk workflows".
- Changed system architecture to require real Splunk environment context before final SPL generation.
- Changed generated assets from one-time outputs to reviewable, exportable, versionable artifacts.
- Changed safety model from passive warnings to explicit validation and human approval gates.
- Positioned Splunk MCP Server from optional integration to core controlled execution bridge.

### Security

- Added human approval requirements before high-risk actions:
  - Creating or modifying alerts
  - Changing saved searches
  - Writing to Splunk KV Store
  - Creating incident tickets
  - Sending notifications
  - Running broad or expensive searches
- Added comprehensive validation checks for risky SPL patterns.
- Established audit logging as first-class design requirement.
- Defined least-privilege MCP access model with role separation:
  - Read-only search role
  - Metadata discovery role
  - Saved-search author role
  - Dashboard author role
  - Admin-only deployment role

---

## [0.3.0] - 2026-05-24

### Added

- Completed hackathon research and ecosystem analysis phase.
- Hackathon timeline awareness:
  - Registration period understanding
  - Submission period requirements
  - Feedback, judging, and announcement windows
- Eligibility and team-size planning considerations.
- Judging criteria alignment documentation:
  - Technological implementation expectations
  - Design quality benchmarks
  - Potential impact assessment
  - Idea originality standards
- Prize and track context for strategic planning.
- Project-track mapping for:
  - Observability track alignment
  - Security track alignment
  - Platform track alignment
- Technology inventory of Splunk AI ecosystem:
  - AI for Splunk Apps
  - Splunk MCP Server capabilities
  - Splunk AI Assistant for SPL
  - Splunk AI Toolkit
  - Splunk Hosted Models
  - Splunk Python SDK
  - Splunk app framework
- Splunk access plan:
  - Free account creation pathway
  - Splunk Enterprise free trial installation
  - Developer License request process
  - Token-based authentication setup
- Resource planning for:
  - Official Splunk documentation
  - Splunkbase app repository
  - MCP configuration guides
  - AI Assistant setup resources
  - AI Toolkit resources
  - Hosted Models reference materials
- Support channel awareness for:
  - Splunk Community Slack
  - Official hackathon support channels
- Initial ecosystem strategy for building beyond hackathon scope.

### Changed

- Shifted research focus from generic project ideas to deep Splunk platform understanding.
- Prioritized Splunk-native capabilities over external tool dependencies.
- Prioritized agentic workflows demonstrable within Splunk ecosystem.
- Prioritized solutions addressing real operational team workflows:
  - Monitoring and observability
  - Threat detection and investigation
  - Incident response automation
  - Splunk app development productivity

### Security

- Identified MCP access control and authentication as critical design concern.
- Selected token-based authentication as practical MVP approach.
- Identified OAuth support as future enhancement pending broader availability.

---

## [0.2.0] - 2026-05-24

### Added

- Project identity: **SPL Forge**
- Core brand metaphor: "a forge that turns rough operational intent into production-grade Splunk intelligence"
- Product positioning as professional-level agentic operations platform for Splunk users.
- Submission-ready project description (under 350 characters).
- Early branding and visual identity direction.
- Narrative framework emphasizing originality, scalability, and enterprise readiness.
- Product vision of generating beyond SPL queries:
  - Dashboards and visualizations
  - Alerts and detections
  - Runbooks and procedures
  - Reports and summaries
  - Splunk app components

### Changed

- Reframed project from generic AI hackathon concept to named, branded product.
- Changed output goal from basic demo to polished professional submission with:
  - Compelling product story
  - Complete architecture documentation
  - Clear growth and scalability path
- Refined pitch to emphasize:
  - Developer productivity improvements
  - Observability capabilities
  - Security workflow automation
  - Platform extensibility
  - Splunk-native design

---

## [0.1.0] - 2026-05-24

### Added

- SPL Forge project exploration initiation within hackathon context.
- Research requirements established for:
  - Hackathon rules and constraints
  - Available tools and technologies
  - Splunk platform capabilities analysis
  - Integration opportunity identification
  - Product scalability assessment
- Requirement to create original solution avoiding common hackathon approaches.
- Requirement to defer project ideas until comprehensive platform research complete.
- High ambition level setting: complex, professional-grade implementation.

### Changed

- Established research-first and architecture-first project direction.
- Set expectation for product capability beyond hackathon scope.
- Focused on leveraging current Splunk AI capabilities vs. treating Splunk as basic search engine.

---

## [0.0.1] - 2026-05-24

### Added

- Initial project workspace creation for Splunk Agentic Ops Hackathon planning.
- Source context files ingestion:
  - Hackathon rules and requirements
  - Available resources and tools
  - Challenge overview and scope
  - Platform guidelines
- GitHub repository initialization with foundational configuration.
- VS Code extension project scaffolding:
  - TypeScript configuration (tsconfig.json)
  - ESLint setup for code quality (eslint.config.mjs)
  - esbuild bundler configuration for fast compilation
  - Package.json with NPM dependency management
  - Build scripts for development and production
- Extension entry point: `src/extension.ts` with minimal activation logic.
- Test infrastructure setup:
  - Mocha test framework integration
  - VS Code test CLI configuration
  - Electron testing environment
- Initial project direction statement: leverage AI and Splunk together to improve observability, security, platform operations, and developer productivity.
- Project branding assets directory (assets/).
- Documentation structure with docs/ directory for future content.

---

## Release Notes Policy

SPL Forge changelog entries prioritize usefulness for builders, judges, maintainers, and future users. Each release describes changes at these levels:

- **Product**: User-facing features and capabilities
- **Architecture**: Design changes and system improvements
- **Implementation**: Code structure and technical decisions
- **Documentation**: Updated guides and specifications
- **Safety**: Security, permissions, and reliability improvements

### Recommended Categories

- **Added**: New features, documentation, architecture components, APIs, agents, integrations, demo flows, and assets
- **Changed**: Updates to product direction, architecture, workflows, dependencies, or user experience
- **Deprecated**: Features or APIs scheduled for removal in future versions
- **Removed**: Deleted features, files, integrations, or abandoned approaches
- **Fixed**: Corrections to documentation, prompts, SPL behavior, validation logic, or bugs
- **Security**: Guardrails, authentication, authorization, audit logging, PII handling, MCP permissions, and controlled execution improvements

---

## Versioning Policy

Before the first production release (1.0.0), SPL Forge uses `0.x.y` semantic versioning:

- **0.0.x** – Initial setup and repository preparation
- **0.1.x** – Research and concept definition
- **0.2.x** – Branding, pitch, and submission narrative
- **0.3.x** – Hackathon ecosystem research and track alignment
- **0.4.x** – Complete product specification and architecture
- **0.5.x** – First working MVP implementation
- **0.6.x** – Splunk MCP integration and connectivity
- **0.7.x** – Artifact generation (dashboards, alerts, runbooks)
- **0.8.x** – Security hardening and test coverage
- **0.9.x** – Demo polish and submission readiness
- **1.0.0** – First stable release after hackathon prototype validation

---

## Future Release Targets

### [0.5.0] - MVP Workspace (10 days)

**Goal**: Working VS Code extension that can accept natural language prompts, generate SPL, execute against Splunk, and export basic artifacts.

Planned scope:

- Working webview UI for prompt input and result display
- Backend API server (FastAPI or NestJS)
- Intent analysis endpoint and agent
- SPL generation endpoint with LLM integration
- SPL validation endpoint with safety checks
- Local state model for session management
- Basic approval UI for high-risk actions
- Example generated SPL explanations
- Demo-ready mock data and scenarios

Success criteria: Judges can watch a 3-minute demo seeing natural-language prompt → generated SPL → execution → error repair → result preview → exported artifact.

### [0.6.0] - Splunk MCP Integration

Planned scope:

- Splunk MCP Server connection and authentication
- Token-based credential management
- Metadata discovery (indexes, sourcetypes, fields)
- Controlled SPL execution via MCP
- Search result retrieval and streaming
- Job status polling and monitoring
- MCP error handling and graceful fallbacks
- Mock connector for demo reliability

### [0.7.0] - Artifact Forge

Planned scope:

- Dashboard draft generation (XML/JSON)
- Alert configuration generation
- Runbook and procedure generation
- Incident timeline generation
- Splunk app file scaffolding
- Exportable Markdown and JSON artifacts
- Multi-format export options (zip, folder, Splunkbase-ready)

### [0.8.0] - Guardrails and Quality

Planned scope:

- Expanded SPL safety scanner with comprehensive rule set
- Query cost estimation and optimization heuristics
- Sensitive field detection and PII handling
- Approval policy configuration framework
- Audit log ingestion into Splunk for self-observability
- Comprehensive unit tests for agents
- Integration tests against local Splunk environment
- Error recovery and resilience testing

### [0.9.0] - Hackathon Submission Candidate

Planned scope:

- Final demo script and talking points
- Final project description and value proposition
- Demo screenshots and video assets
- Deployment and setup instructions
- Security considerations documentation
- Judge-facing technical implementation summary
- Design, impact, and originality explanation
- Clean repository structure with reproducible setup
- Comprehensive README and getting started guide

### [1.0.0] - Stable Release (Post-Hackathon)

Expected scope (contingent on hackathon results):

- Production-ready codebase with performance optimization
- Enterprise security features (RBAC, SSO, audit trails)
- Team collaboration and approval workflows
- Multi-environment support (dev, staging, production)
- Advanced LLM model options and fine-tuning
- Splunkbase app marketplace availability
- Ongoing support and community engagement

---

## Development Status

### Current Phase: Foundation/MVP Planning (0.0.1 → 0.5.0)

**Completed:**
- ✅ Project research and planning (0.1.0 → 0.3.0)
- ✅ Branding and product definition (0.2.0)
- ✅ Complete product specification (0.4.0)
- ✅ VS Code extension scaffolding with TypeScript and build pipeline
- ✅ Documentation structure and initial guides
- ✅ GitHub repository initialization
- ✅ Development environment setup

**In Progress:**
- 🔄 Backend API implementation
- 🔄 Splunk connector and MCP integration
- 🔄 Agent orchestration framework
- 🔄 LLM provider integration
- 🔄 Webview UI development

**Planned:**
- ⏳ Self-debugging loop implementation
- ⏳ Dashboard and alert generation
- ⏳ Artifact packaging and export
- ⏳ Comprehensive testing and validation
- ⏳ Demo scenario execution and polish

---

## Links and References

- **Product Requirements**: [PRD.md](./PRD.md)
- **Roadmap**: [ROADMAP.md](./ROADMAP.md)
- **Architecture**: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **Getting Started**: [docs/QUICKSTART.md](./docs/QUICKSTART.md)
- **Full Specification**: [docs/ABOUT.md](./docs/ABOUT.md)

---

**Last Updated**: 2026-05-24  
**Maintainer**: Utpal-Kalita and Contributors

[Unreleased]: https://github.com/Utpal-Kalita/SPL-Forge/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/Utpal-Kalita/SPL-Forge/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Utpal-Kalita/SPL-Forge/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Utpal-Kalita/SPL-Forge/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Utpal-Kalita/SPL-Forge/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/Utpal-Kalita/SPL-Forge/releases/tag/v0.0.1
