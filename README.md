<img src="./assets/spl-forge-banner.png" alt="SPL Forge banner" width="100%" />

<div align="center">

# SPL Forge

## AI-native agentic IDE for Splunk

**AI-native Splunk development workspace for turning natural language into validated SPL, dashboards, alerts, and app-ready artifacts.**

[![Built for Splunk](https://img.shields.io/badge/Built%20for-Splunk-00B140?style=flat-square)](#)
[![VS Code](https://img.shields.io/badge/VS%20Code-Extension-007ACC?style=flat-square)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=flat-square)](#)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square)](#)
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
- Docker-ready local development environment for rapid iteration

## Product Direction

According to PRD, SPL Forge is being designed as:

- VS Code extension with optional companion web experience
- Practical agentic IDE for Splunk developers and analysts
- Hackathon-ready MVP focused on one polished end-to-end workflow
- Foundation for broader AI-native Splunk development operations
- Docker-supported local development for team consistency

Initial demo scenario is centered on failed-login monitoring, where system generates query, detects or simulates error, repairs it with schema context, previews results, and exports dashboard and alert package.

## Intended Users

- Splunk app developers who want to move from idea to artifact faster
- Security analysts creating detection searches and dashboards
- SRE and DevOps teams building operational monitoring views under time pressure
- Splunk admins and platform engineers supporting repeatable content creation
- Development teams looking for reproducible, containerized Splunk environments

## Architecture Snapshot

| Layer | Planned Approach |
| --- | --- |
| IDE | VS Code extension |
| Language | TypeScript and Node.js |
| UI | Webview-based interface, with optional web dashboard |
| Validation | Structured schema and artifact validation |
| Splunk connectivity | Splunk MCP Server, REST fallback, or mock connector |
| Local Splunk | Docker container (development) or self-hosted (production) |
| AI layer | Hosted models or provider adapters |
| Export | Dashboard, alert, report, and app-ready artifact generation |

## Quick Start

Fastest path with Docker:

```bash
# 1. Clone and install
git clone https://github.com/Utpal-Kalita/SPL-Forge SPL-Forge
cd SPL-Forge
npm install

# 2. Start Splunk via Docker
docker-compose up -d

# 3. Configure environment
cp .env.example .env.local

# 4. Launch extension
npm run watch
# Then press F5 in VS Code
```

See [`docs/DOCKER_SETUP.md`](./docs/DOCKER_SETUP.md) for full Docker instructions.

## Current Status

This repository currently captures product definition and roadmap for MVP. It is best understood as project foundation rather than finished implementation.

Current repository assets:

- Product requirements in [`PRD.md`](./PRD.md)
- Delivery roadmap in [`ROADMAP.md`](./ROADMAP.md)
- Setup guides for VS Code, Splunk, Docker, and first-run workflow
- Supporting docs for architecture, demo flow, and contribution expectations
- Docker Compose configuration for reproducible local environments
- Brand banner and repository presentation assets

## Documentation

- [Product Requirements Document](./PRD.md)
- [Roadmap](./ROADMAP.md)
- [Progress](./docs/PROGRESS.md)
- [Quickstart](./docs/QUICKSTART.md)
- [VS Code Setup](./docs/VS_CODE_SETUP.md)
- [Splunk Setup](./docs/SPLUNK_SETUP.md)
- [Docker Setup](./docs/DOCKER_SETUP.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Demo Runbook](./docs/DEMO_RUNBOOK.md)

## Vision

SPL Forge is built around one clear idea: Splunk development should feel more like describing intent and less like manually stitching together query syntax, dashboard configs, and packaging steps. With Docker integration, teams can maintain consistent, reproducible development environments across machines.

Long-term opportunity is AI-native development layer for Splunk that can help teams generate, verify, explain, and operationalize Splunk content with less friction and more trust.

---

<div align="center">

**SPL Forge**  
From natural-language intent to validated Splunk artifacts, with Docker-powered local development.

</div>
