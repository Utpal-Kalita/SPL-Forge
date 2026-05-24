# SPL FORGE

**SPL FORGE** is an agentic Splunk operations workbench that turns natural-language operational intent into safe, validated, production-ready Splunk assets: SPL searches, correlation rules, dashboards, alerts, runbooks, investigation timelines, and reusable app components.

The project is designed for the **Splunk Agentic Ops Hackathon** and focuses on developer productivity, observability, security, and platform extensibility by combining **Splunk**, **Splunk MCP Server**, **Splunk AI capabilities**, and a controlled multi-agent workflow.

---

## 1. Problem Statement

Modern teams depend on Splunk to investigate incidents, monitor systems, detect threats, and build operational intelligence. However, building high-quality SPL and operational workflows still requires deep Splunk expertise.

Teams often struggle with:

- Writing correct and efficient SPL queries.
- Translating incident questions into investigation paths.
- Reusing previous searches, dashboards, and detections.
- Validating SPL before running it on large datasets.
- Converting findings into alerts, runbooks, or Splunk apps.
- Giving AI agents safe access to operational data.

**SPL FORGE solves this by acting as an AI-native engineering layer for Splunk.** It does not simply generate SPL. It forges, tests, explains, optimizes, and operationalizes Splunk workflows.

---

## 2. Core Idea

SPL FORGE is a guided agentic system where users describe what they want to monitor, investigate, detect, or automate. The system then uses specialized agents and MCP-connected tools to create verified Splunk artifacts.

Example user prompts:

```text
Find unusual authentication failures across our Linux and cloud logs.
```

```text
Create an alert for API latency regression and explain the SPL.
```

```text
Build a Splunk dashboard for Kubernetes service health.
```

```text
Investigate why checkout latency increased after the latest deployment.
```

SPL FORGE converts these prompts into:

- SPL query plans.
- Safe executable searches.
- Query explanations.
- Optimized SPL versions.
- Dashboards and visualizations.
- Alerts and saved searches.
- Detection logic.
- Incident timelines.
- Runbooks.
- App scaffolds for Splunk.

---

## 3. How SPL FORGE Works

SPL FORGE uses a **forge pipeline**. Each stage improves the quality, safety, and usefulness of the generated operational asset.

### Stage 1: Intent Capture

The user enters an operational goal in natural language.

SPL FORGE extracts:

- Target domain: observability, security, platform, developer productivity.
- Data source assumptions.
- Required indexes, sourcetypes, fields, entities, services, users, hosts, or cloud resources.
- Desired output: search, alert, dashboard, runbook, investigation, detection, or app component.
- Risk level of the requested action.

### Stage 2: Context Discovery

SPL FORGE queries Splunk metadata through MCP-connected tools.

It discovers:

- Available indexes.
- Sourcetypes.
- Field names.
- Common event patterns.
- Existing saved searches.
- Existing dashboards.
- Existing alerts.
- Knowledge objects.
- Lookup tables.
- Data models.

This prevents the agent from generating generic SPL that does not match the user’s actual Splunk environment.

### Stage 3: SPL Drafting

A specialized SPL generation agent creates the first version of the query.

The agent considers:

- Splunk SPL syntax.
- Search performance.
- Field availability.
- Time range.
- Aggregation strategy.
- Security and privacy constraints.
- Whether the query should be exploratory, scheduled, or alert-ready.

### Stage 4: Static Validation

Before running anything, SPL FORGE validates the SPL.

Validation checks include:

- Syntax structure.
- Dangerous commands.
- Expensive command patterns.
- Missing indexes or fields.
- Unbounded searches.
- Risky wildcards.
- Excessive time windows.
- Incompatible command ordering.

### Stage 5: Controlled Execution Through Splunk MCP Server

After validation, SPL FORGE sends approved searches to Splunk through the **Splunk MCP Server**.

The MCP layer provides a standard, controlled interface between the AI agent and Splunk data. SPL FORGE uses it to:

- Run searches.
- Fetch search results.
- Retrieve metadata.
- Inspect indexes and sourcetypes.
- Query knowledge objects.
- Generate context-aware responses.

Authentication is designed around **token-based authentication** for the hackathon implementation. OAuth can be added later as Splunk MCP OAuth support matures.

### Stage 6: Result Analysis

The result analysis agent reviews Splunk output and determines whether the query achieved the goal.

It checks:

- Empty result sets.
- Incorrect field usage.
- Outlier patterns.
- Top entities.
- Temporal trends.
- Candidate root causes.
- Security anomalies.
- Performance anomalies.

If results are weak, the agent can propose a refined SPL query instead of pretending the output is correct.

### Stage 7: Optimization

The optimization agent improves the SPL for production usage.

It can:

- Add index and sourcetype constraints.
- Replace inefficient commands.
- Reduce data scanned.
- Improve aggregation logic.
- Add accelerated data model usage where available.
- Suggest summary indexing or report acceleration.
- Convert exploratory SPL into alert-ready SPL.

### Stage 8: Artifact Generation

SPL FORGE generates final Splunk assets:

- Saved searches.
- Alerts.
- Dashboard JSON/XML.
- Detection rules.
- Investigation reports.
- Markdown runbooks.
- Splunk app file structure.
- Test fixtures.
- MCP tool manifests.

### Stage 9: Human Review and Approval

SPL FORGE is designed to be human-in-the-loop.

Before creating or modifying important Splunk objects, it shows:

- The generated SPL.
- Explanation of what the SPL does.
- Estimated risk.
- Expected output.
- Recommended time range.
- Required permissions.
- Rollback notes.

The user approves before production-impacting actions.

---

## 4. Main Features

### 4.1 Natural Language to SPL

Users describe what they want, and SPL FORGE generates environment-aware SPL.

Example:

```text
Show failed login spikes by user and source IP over the last 24 hours.
```

Output:

```spl
index=security sourcetype=linux_secure action=failure earliest=-24h
| stats count by user, src_ip
| where count > 10
| sort - count
```

### 4.2 SPL Explainer

Every generated query includes a plain-English explanation:

- What the query searches.
- Why each command is used.
- What fields are required.
- What output means.
- How to tune the query.

### 4.3 SPL Safety Scanner

The safety scanner flags risky or expensive searches before execution.

It detects:

- Missing index constraints.
- Wide time ranges.
- Leading wildcards.
- High-cardinality aggregations.
- Risky commands.
- Unbounded joins.
- Inefficient transaction usage.

### 4.4 SPL Optimizer

The optimizer rewrites queries for speed, clarity, and production readiness.

It can recommend:

- `tstats` where data models exist.
- More selective filters.
- Earlier field extraction.
- Reduced use of `join`.
- Better `stats` patterns.
- Summary indexing.
- Report acceleration.

### 4.5 Agentic Incident Investigation

SPL FORGE can guide investigations across multiple searches.

For an incident, it can:

- Identify affected services.
- Build a timeline.
- Compare current behavior with baseline behavior.
- Correlate logs, metrics, traces, alerts, and deployment events.
- Suggest likely root causes.
- Generate an incident report.

### 4.6 Alert and Detection Builder

SPL FORGE can convert an investigation query into an alert.

It produces:

- SPL query.
- Trigger condition.
- Severity.
- Schedule.
- Throttling settings.
- Alert description.
- Recommended response steps.
- False-positive notes.

### 4.7 Dashboard Forge

Users can describe dashboards in natural language.

SPL FORGE generates:

- Panels.
- Searches.
- Tokens.
- Layout structure.
- Visual recommendations.
- Dashboard source configuration.

Example prompt:

```text
Create an executive dashboard for API reliability, latency, errors, and saturation.
```

### 4.8 Runbook Generator

SPL FORGE turns searches and findings into operational runbooks.

Runbooks include:

- Incident summary.
- Investigation steps.
- SPL commands.
- Expected results.
- Escalation paths.
- Remediation suggestions.
- Verification queries.

### 4.9 Splunk App Builder

SPL FORGE can generate the structure for a Splunk app.

Possible generated files:

```text
spl-forge-app/
├── default/
│   ├── app.conf
│   ├── savedsearches.conf
│   ├── macros.conf
│   └── data/ui/views/dashboard.xml
├── metadata/
│   └── default.meta
├── bin/
│   └── agentic_workflow.py
├── README.md
└── appserver/static/
```

### 4.10 Knowledge Object Reuse

SPL FORGE discovers and reuses existing Splunk knowledge objects:

- Event types.
- Tags.
- Macros.
- Lookups.
- Field aliases.
- Saved searches.
- Data models.

This makes generated assets consistent with the existing Splunk environment.

---

## 5. How This Project Uses Splunk

SPL FORGE uses Splunk as the operational data platform and execution layer.

### 5.1 Splunk Enterprise or Splunk Cloud

Splunk stores and searches operational data including:

- Application logs.
- Infrastructure logs.
- Authentication logs.
- Security events.
- Kubernetes events.
- Cloud audit logs.
- Metrics.
- Alerts.
- Deployment events.

### 5.2 SPL Search Engine

SPL FORGE generates and executes SPL queries to:

- Investigate incidents.
- Detect anomalies.
- Measure service health.
- Identify suspicious behavior.
- Create dashboards.
- Build alerts.

### 5.3 Splunk MCP Server

The Splunk MCP Server is the secure bridge between SPL FORGE agents and Splunk.

SPL FORGE uses MCP to give agents controlled access to Splunk capabilities without hardcoding direct integrations into every agent.

Primary MCP operations:

- Search Splunk data.
- Retrieve search job status.
- Fetch search results.
- Inspect metadata.
- Access knowledge objects.
- Support AI-driven workflows using standardized tool calls.

### 5.4 Splunk AI Assistant for SPL

SPL FORGE can use Splunk AI Assistant for SPL as a helper capability for:

- SPL generation.
- SPL editing.
- SPL explanation.
- Query refinement.

### 5.5 Splunk AI Toolkit

SPL FORGE can use the Splunk AI Toolkit for advanced analytics:

- Anomaly detection.
- Forecasting.
- Clustering.
- Classification.
- Custom ML workflows.
- Data-driven recommendations.

### 5.6 Splunk Hosted Models

Splunk Hosted Models can support specialized AI tasks such as:

- Security event reasoning.
- Time-series analysis.
- Alert enrichment.
- Incident summarization.
- Pattern recognition.

### 5.7 Splunk Apps with Python SDK

SPL FORGE can be packaged as or integrated into a Splunk app using Splunk’s app development model and Python SDK.

The app can provide:

- A user interface inside Splunk.
- Custom search commands.
- Modular inputs.
- Custom alert actions.
- Saved workflows.
- Agentic investigation panels.

---

## 6. MCP Server Architecture

SPL FORGE is designed around a modular MCP architecture.

```text
User
  │
  ▼
SPL FORGE UI / API
  │
  ▼
Agent Orchestrator
  │
  ├── Intent Agent
  ├── SPL Generator Agent
  ├── SPL Validator Agent
  ├── Search Execution Agent
  ├── Result Analyst Agent
  ├── Optimizer Agent
  ├── Dashboard Agent
  ├── Alert Builder Agent
  └── Runbook Agent
  │
  ▼
MCP Gateway
  │
  ├── Splunk MCP Server
  ├── Documentation MCP Server
  ├── GitHub MCP Server
  ├── Ticketing MCP Server
  ├── CI/CD MCP Server
  └── Notification MCP Server
  │
  ▼
Splunk Enterprise / Splunk Cloud / Splunk Observability / External Systems
```

### 6.1 Splunk MCP Server

Purpose:

- Execute SPL.
- Retrieve metadata.
- Read search results.
- Connect agents to Splunk data.

Example tools:

```text
splunk.search
splunk.get_search_results
splunk.get_indexes
splunk.get_sourcetypes
splunk.get_fields
splunk.get_saved_searches
splunk.get_dashboards
```

### 6.2 Documentation MCP Server

Purpose:

- Retrieve internal runbooks.
- Search engineering documentation.
- Ground agent responses in company procedures.

Example tools:

```text
docs.search
docs.get_page
docs.create_runbook
```

### 6.3 GitHub MCP Server

Purpose:

- Inspect repositories.
- Link incidents to deployments.
- Generate pull requests for Splunk app files.
- Store generated assets as version-controlled code.

Example tools:

```text
github.search_repositories
github.get_commits
github.create_pull_request
github.write_file
```

### 6.4 Ticketing MCP Server

Purpose:

- Create incident tickets.
- Attach SPL evidence.
- Update investigation status.

Example tools:

```text
ticket.create
ticket.update
ticket.attach_evidence
```

### 6.5 CI/CD MCP Server

Purpose:

- Correlate deployments with operational changes.
- Validate generated Splunk app packages.
- Run tests before deployment.

Example tools:

```text
cicd.get_deployments
cicd.run_validation
cicd.get_pipeline_status
```

### 6.6 Notification MCP Server

Purpose:

- Send human-approved summaries to Slack, Teams, or email.
- Notify responders when a generated alert is ready.

Example tools:

```text
notify.send_message
notify.send_incident_summary
```

---

## 7. Agent Design

SPL FORGE uses specialized agents instead of one generic AI agent.

### 7.1 Intent Agent

Understands the user’s operational goal and classifies the task.

Outputs:

- Goal type.
- Required data sources.
- Expected artifact.
- Risk level.

### 7.2 Schema Discovery Agent

Inspects Splunk metadata through MCP.

Outputs:

- Candidate indexes.
- Candidate sourcetypes.
- Available fields.
- Existing knowledge objects.

### 7.3 SPL Generator Agent

Creates the first SPL draft.

Outputs:

- SPL query.
- Explanation.
- Required assumptions.

### 7.4 Validator Agent

Checks the SPL before execution.

Outputs:

- Safety score.
- Syntax warnings.
- Performance warnings.
- Approval status.

### 7.5 Execution Agent

Runs approved searches through Splunk MCP.

Outputs:

- Search job ID.
- Results.
- Execution metadata.

### 7.6 Analyst Agent

Interprets search results.

Outputs:

- Findings.
- Anomalies.
- Timeline.
- Recommended next searches.

### 7.7 Optimizer Agent

Improves SPL quality and performance.

Outputs:

- Optimized SPL.
- Before/after comparison.
- Performance notes.

### 7.8 Artifact Agent

Converts validated results into production assets.

Outputs:

- Dashboards.
- Alerts.
- Runbooks.
- Splunk app files.

---

## 8. Tech Stack

### Frontend

- React or Next.js.
- TypeScript.
- Tailwind CSS.
- Monaco Editor for SPL editing.
- Recharts or Apache ECharts for visualizations.
- WebSocket or Server-Sent Events for live agent progress.

### Backend

- Python FastAPI or Node.js/NestJS.
- LangGraph, OpenAI Agents SDK, or similar orchestration framework.
- Pydantic or Zod for schema validation.
- Async workers for long-running searches.
- REST API for UI-to-agent communication.

### Agent and AI Layer

- LLM-based agent orchestration.
- Tool-calling interface.
- Retrieval-augmented generation for docs and runbooks.
- Prompt templates for SPL generation, validation, optimization, and explanation.
- Guardrails for safe Splunk execution.

### Splunk Layer

- Splunk Enterprise or Splunk Cloud.
- Splunk MCP Server.
- Splunk AI Assistant for SPL.
- Splunk AI Toolkit.
- Splunk Hosted Models.
- Splunk Python SDK.
- Splunk custom app framework.

### MCP Layer

- Splunk MCP Server.
- Custom MCP Gateway.
- Optional GitHub MCP Server.
- Optional Documentation MCP Server.
- Optional Ticketing MCP Server.
- Optional CI/CD MCP Server.
- Optional Notification MCP Server.

### Data and Storage

- Splunk indexes for operational data.
- Splunk KV Store for workflow memory and generated artifact metadata.
- PostgreSQL for app-level state if needed.
- Redis for job queues and short-lived cache.
- Object storage for exported reports and generated app bundles.

### DevOps

- Local Splunk Enterprise free trial with Developer License.
- GitHub Actions.
- Terraform for optional infrastructure.
- OpenTelemetry for app telemetry.
- Splunk Universal Forwarder or HTTP Event Collector for ingesting SPL FORGE telemetry back into Splunk.

---

## 9. Core Data Flow

```text
1. User submits natural-language request.
2. Intent Agent classifies the request.
3. Schema Discovery Agent asks Splunk MCP Server for environment context.
4. SPL Generator Agent creates candidate SPL.
5. Validator Agent checks safety, syntax, and performance.
6. User reviews or auto-approval policy allows safe execution.
7. Execution Agent runs the query through Splunk MCP Server.
8. Analyst Agent interprets results.
9. Optimizer Agent improves the SPL.
10. Artifact Agent generates dashboards, alerts, runbooks, or app files.
11. Final assets are saved to Splunk, GitHub, or exported for review.
```

---

## 10. Security and Safety Model

SPL FORGE is built for controlled agentic access.

### 10.1 Human-in-the-Loop Approval

High-risk actions require approval before execution.

Examples:

- Creating alerts.
- Modifying saved searches.
- Writing to Splunk KV Store.
- Creating tickets.
- Sending notifications.
- Running broad searches.

### 10.2 Query Guardrails

The validator blocks or warns on:

- No index constraint.
- Very large time ranges.
- Expensive joins.
- Risky commands.
- Sensitive field exposure.
- Incomplete SPL.
- Searches that may scan excessive data.

### 10.3 Least-Privilege MCP Access

Each MCP tool should expose only the minimum capability needed.

Recommended roles:

- Read-only search role.
- Metadata discovery role.
- Saved-search author role.
- Dashboard author role.
- Admin-only deployment role.

### 10.4 Audit Logging

SPL FORGE logs every major action:

- User prompt.
- Generated SPL.
- Validation result.
- Approval decision.
- Executed search.
- Search metadata.
- Generated artifact.
- Final user action.

These logs can be sent back into Splunk for monitoring SPL FORGE itself.

---

## 11. Scalability Plan

SPL FORGE is designed to scale from a hackathon demo to an enterprise product.

### 11.1 Stateless API Layer

The frontend communicates with stateless backend APIs. This allows horizontal scaling behind a load balancer.

### 11.2 Async Search Execution

Long-running Splunk searches are handled by background workers.

The UI receives progress updates through WebSocket or Server-Sent Events.

### 11.3 Job Queue

Redis, Celery, BullMQ, or a similar queue system can manage:

- Search jobs.
- Report generation.
- Dashboard creation.
- App packaging.
- Scheduled validation.

### 11.4 Environment-Aware Caching

SPL FORGE can cache low-risk metadata:

- Index list.
- Sourcetypes.
- Common fields.
- Saved searches.
- Dashboard inventory.

This reduces repeated calls to Splunk and improves response time.

### 11.5 Multi-Tenant Design

For enterprise usage, SPL FORGE can isolate:

- Users.
- Teams.
- Splunk connections.
- MCP credentials.
- Generated artifacts.
- Approval policies.

---

## 12. Example Use Cases

### 12.1 Observability

Prompt:

```text
Investigate why payment latency increased in the last hour.
```

SPL FORGE can:

- Query service logs.
- Compare latency against baseline.
- Correlate with deployment events.
- Identify affected endpoints.
- Generate a timeline.
- Create a dashboard panel.
- Produce an incident summary.

### 12.2 Security

Prompt:

```text
Detect impossible travel logins and create a Splunk alert.
```

SPL FORGE can:

- Discover authentication sourcetypes.
- Generate SPL detection logic.
- Validate required fields.
- Explain false-positive conditions.
- Create an alert draft.
- Generate response steps.

### 12.3 Platform Engineering

Prompt:

```text
Generate a Splunk app that monitors Kubernetes pod restarts and deployment failures.
```

SPL FORGE can:

- Create saved searches.
- Create dashboards.
- Add macros.
- Generate app configuration files.
- Package the app structure.
- Push files to GitHub for review.

### 12.4 Developer Productivity

Prompt:

```text
Turn this vague investigation question into three good SPL searches.
```

SPL FORGE can:

- Clarify the question.
- Generate search variants.
- Explain each query.
- Recommend which one to run first.

---

## 13. Demo Flow

A strong demo can follow this sequence:

1. Open SPL FORGE.
2. Ask: `Why did checkout latency spike after the latest deployment?`
3. SPL FORGE discovers indexes, sourcetypes, and fields through Splunk MCP Server.
4. It generates safe SPL and explains it.
5. The validator warns about any risky patterns.
6. The user approves execution.
7. SPL FORGE runs the search through Splunk MCP.
8. The analyst agent finds a latency spike linked to a deployment window.
9. The optimizer improves the query.
10. SPL FORGE creates:
    - an incident timeline,
    - a dashboard panel,
    - an alert draft,
    - and a runbook.
11. The final assets are exported or saved into Splunk.

---

## 14. Repository Structure

Recommended structure:

```text
spl-forge/
├── apps/
│   ├── web/                    # Frontend app
│   └── api/                    # Backend API
├── agents/
│   ├── intent_agent.py
│   ├── schema_agent.py
│   ├── spl_generator_agent.py
│   ├── validator_agent.py
│   ├── execution_agent.py
│   ├── analyst_agent.py
│   ├── optimizer_agent.py
│   └── artifact_agent.py
├── mcp/
│   ├── splunk_server/
│   ├── github_server/
│   ├── docs_server/
│   └── gateway/
├── splunk_app/
│   ├── default/
│   ├── metadata/
│   ├── bin/
│   └── appserver/
├── guardrails/
│   ├── spl_safety_rules.yaml
│   ├── approval_policies.yaml
│   └── pii_rules.yaml
├── prompts/
│   ├── spl_generation.md
│   ├── spl_validation.md
│   ├── spl_optimization.md
│   └── incident_analysis.md
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── README.md
└── ABOUT.md
```

---

## 15. Environment Variables

Example `.env` configuration:

```env
SPLUNK_HOST=https://localhost:8089
SPLUNK_TOKEN=your_splunk_token
SPLUNK_VERIFY_SSL=false
SPLUNK_DEFAULT_INDEX=main
SPLUNK_MCP_URL=http://localhost:9000
OPENAI_API_KEY=your_model_key
APP_ENV=development
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:password@localhost:5432/splforge
```

---

## 16. API Design

Example backend endpoints:

```text
POST /api/intent/analyze
POST /api/spl/generate
POST /api/spl/validate
POST /api/spl/execute
POST /api/spl/optimize
POST /api/artifacts/dashboard
POST /api/artifacts/alert
POST /api/artifacts/runbook
GET  /api/jobs/:jobId
GET  /api/splunk/metadata
```

---

## 17. Example Agent Output

```json
{
  "intent": "security_detection",
  "risk_level": "medium",
  "spl": "index=security sourcetype=auth earliest=-24h action=failure | stats count by user, src_ip | where count > 10 | sort - count",
  "explanation": "This search finds users and source IPs with more than 10 failed authentication events in the last 24 hours.",
  "validation": {
    "status": "approved_with_warnings",
    "warnings": [
      "Confirm that index=security and sourcetype=auth exist in this environment."
    ]
  },
  "recommended_artifacts": [
    "saved_search",
    "alert",
    "runbook"
  ]
}
```

---

## 18. Why This Is Original

SPL FORGE is not only a chatbot for SPL generation. It is a full lifecycle system for operationalizing Splunk intelligence.

It combines:

- Environment-aware SPL generation.
- MCP-powered safe tool access.
- Multi-agent validation and optimization.
- Human-in-the-loop approvals.
- Dashboard, alert, runbook, and app generation.
- Splunk-native telemetry and auditability.
- A path from hackathon prototype to enterprise product.

The core originality is the **forge model**: every operational artifact is drafted, validated, tested, optimized, explained, and packaged before being used.

---

## 19. Hackathon Track Alignment

SPL FORGE can fit all three major hackathon tracks:

### Observability

- Incident investigation.
- Latency analysis.
- Service health dashboards.
- SLO alert generation.
- Root-cause assistance.

### Security

- Detection engineering.
- Authentication anomaly searches.
- Threat-hunting workflows.
- Alert enrichment.
- Security runbooks.

### Platform

- Splunk app generation.
- Developer productivity tooling.
- SPL validation framework.
- MCP-powered workflow automation.
- AI-assisted Splunk asset creation.

---

## 20. Future Product Vision

SPL FORGE can evolve into a professional Splunk engineering platform.

Possible enterprise features:

- Team workspaces.
- Approval workflows.
- Version control for SPL assets.
- SPL quality scoring.
- Automated regression tests for saved searches.
- Integration with GitHub pull requests.
- Integration with Jira, ServiceNow, Slack, and PagerDuty.
- Role-based access control.
- Environment-specific policy packs.
- Marketplace for reusable SPL Forge recipes.
- Continuous improvement from historical incidents.

---

## 21. Success Metrics

SPL FORGE can be evaluated using:

- Time saved writing SPL.
- Reduction in failed or inefficient searches.
- Number of generated assets approved by users.
- Incident investigation speed.
- Alert quality improvement.
- Query performance improvement.
- Number of reusable runbooks created.
- User trust score after explanation and validation.

---

## 22. Summary

SPL FORGE is an AI-powered, Splunk-native forge for operational intelligence. It helps teams move from vague operational questions to validated SPL, actionable insights, dashboards, alerts, runbooks, and Splunk app components.

By using Splunk MCP Server, Splunk AI capabilities, controlled agentic workflows, and human approval gates, SPL FORGE demonstrates how AI can safely accelerate observability, security, and platform engineering.
