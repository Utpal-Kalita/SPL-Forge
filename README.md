<img src="./assets/spl-forge-banner.png" alt="SPL Forge banner" width="100%" />

<div align="center">

# SPL Forge

## AI-native agentic IDE for Splunk

**AI-native Splunk development workspace for turning natural language into validated SPL, dashboards, alerts, and app-ready artifacts.**

[![Built for Splunk](https://img.shields.io/badge/Built%20for-Splunk-00B140?style=flat-square)](#)
[![VS Code](https://img.shields.io/badge/VS%20Code-Extension-007ACC?style=flat-square)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=flat-square)](#)
[![MCP](https://img.shields.io/badge/MCP-Agentic%20Ops-111827?style=flat-square)](#)

</div>

## Overview

SPL Forge is product concept and build plan for self-debugging Splunk development environment. It is designed to help developers, security teams, and operations engineers describe outcome in natural language and get back validated Splunk artifacts ready for deployment.

Core workflow:

```text
Intent -> Generate SPL -> Execute -> Inspect -> Repair -> Preview -> Export
```

Instead of stopping at query suggestions, SPL Forge is intended to validate its own output against Splunk environment, repair common failures, and package final result into usable assets such as dashboards, alerts, and app packages.

## Why SPL Forge

Building useful Splunk content still requires too much manual effort:

- Users know question they want answered, but not always exact SPL.
- Query failures often come from missing fields, incorrect sourcetypes, or environment-specific schema differences.
- Turning working query into dashboard, alert, or packaged app is still separate workflow.
- Generic AI copilots can suggest SPL, but they do not reliably test and correct it against live Splunk data.

SPL Forge addresses that gap with agentic, execution-aware development loop built for real Splunk workflows.

## What Project Aims to Deliver

- Natural language to SPL generation for Splunk searches and detections
- Self-debugging query loop using execution feedback and schema introspection
- Support for Splunk-aware context such as indexes, sourcetypes, and fields
- Export flows for dashboards, alerts, reports, and lightweight app packaging
- Human-in-the-loop approvals before execution and export
- Demo-safe support for MCP, REST fallback, or mock environments
- Local Splunk Enterprise development environment for rapid iteration

## Product Direction

According to PRD, SPL Forge is being designed as:

- VS Code extension with optional companion web experience
- Practical agentic IDE for Splunk developers and analysts
- Hackathon-ready MVP focused on one polished end-to-end workflow
- Foundation for broader AI-native Splunk development operations
- Self-hosted local development path aligned with Splunk free trial and Developer License flow

Initial demo scenario is centered on failed-login monitoring, where system generates query, detects or simulates error, repairs it with schema context, previews results, and exports dashboard and alert package.

## Intended Users

- Splunk app developers who want to move from idea to artifact faster
- Security analysts creating detection searches and dashboards
- SRE and DevOps teams building operational monitoring views under time pressure
- Splunk admins and platform engineers supporting repeatable content creation
- Development teams who need repeatable local Splunk validation during build and demo work

## Architecture Snapshot

| Layer | Planned Approach |
| --- | --- |
| IDE | VS Code extension |
| Language | TypeScript and Node.js |
| UI | Webview-based interface, with optional web dashboard |
| Validation | Structured schema and artifact validation |
| Splunk connectivity | Splunk MCP Server, REST fallback, or mock connector |
| Local Splunk | Self-hosted Splunk Enterprise free trial with Developer License |
| AI layer | Hosted models or provider adapters |
| Export | Dashboard, alert, report, and app-ready artifact generation |

## Quick Start

Fastest path with Splunk Enterprise free trial:

```bash
# 1. Clone and install
git clone https://github.com/Utpal-Kalita/SPL-Forge SPL-Forge
cd SPL-Forge
npm install

# 2. Install Splunk Enterprise free trial and apply Developer License
# Follow docs/FREE_TRIAL_SETUP.md

# 3. Configure environment
cp .env.example .env.local

# 4. Launch extension
npm run watch
# Then press F5 in VS Code
```

See [`docs/FREE_TRIAL_SETUP.md`](./docs/FREE_TRIAL_SETUP.md) for full Splunk setup instructions.

## Current Status

This repository currently captures product definition and roadmap for MVP. It is best understood as project foundation rather than finished implementation.

Current repository assets:

- Product requirements in [`PRD.md`](./PRD.md)
- Delivery roadmap in [`ROADMAP.md`](./ROADMAP.md)
- Setup guides for VS Code, Splunk, and first-run workflow
- Supporting docs for architecture, demo flow, and contribution expectations
- Brand banner and repository presentation assets
- VS Code extension shell with intent-aware SPL generation and query plan feedback
- MCP/REST/mock Splunk execution path with result preview in the panel
- Day 5 self-debugging loop that inspects schema after failed or empty execution, repairs common SPL mistakes, and reruns with capped attempts
- Root architecture diagram and MIT license for hackathon submission readiness

## Documentation

- [Docs Index](./docs/README.md)
- [Product Requirements Document](./PRD.md)
- [Roadmap](./ROADMAP.md)
- [Progress](./docs/PROGRESS.md)
- [Quickstart](./docs/QUICKSTART.md)
- [Day 1 Status](./docs/DAY1_STATUS.md)
- [VS Code Setup](./docs/VS_CODE_SETUP.md)
- [Sample Data](./docs/SAMPLE_DATA.md)
- [Splunk Setup](./docs/SPLUNK_SETUP.md)
- [Splunk MCP Server Research](./docs/SPLUNK_MCP.md)
- [Free Trial Setup](./docs/FREE_TRIAL_SETUP.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Demo Runbook](./docs/DEMO_RUNBOOK.md)

## Vision

SPL Forge is built around one clear idea: Splunk development should feel more like describing intent and less like manually stitching together query syntax, dashboard configs, and packaging steps. For hackathon and MVP work, repository now assumes a self-hosted Splunk Enterprise free trial upgraded with a Developer License.

Long-term opportunity is AI-native development layer for Splunk that can help teams generate, verify, explain, and operationalize Splunk content with less friction and more trust.

---

<div align="center">

**SPL Forge**  
From natural-language intent to validated Splunk artifacts, with Splunk-native local development.

</div>
