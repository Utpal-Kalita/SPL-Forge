<img src="./assets/spl-forge-banner.png" alt="SPL Forge banner" width="100%" />

<div align="center">

# SPL Forge

**AI-native Splunk development workspace for turning natural language into validated SPL, dashboards, alerts, and app-ready artifacts.**

[![Built for Splunk](https://img.shields.io/badge/Built%20for-Splunk-00B140?style=flat-square)](#)
[![VS Code](https://img.shields.io/badge/VS%20Code-Extension-007ACC?style=flat-square)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=flat-square)](#)
[![MCP](https://img.shields.io/badge/MCP-Agentic%20Ops-111827?style=flat-square)](#)

</div>

## Overview

SPL Forge is a product concept and build plan for a self-debugging Splunk development environment. It is designed to help developers, security teams, and operations engineers describe an outcome in plain English and convert that intent into working Splunk artifacts.

The core workflow is simple:

```text
Intent -> Generate SPL -> Execute -> Inspect -> Repair -> Preview -> Export
```

Instead of stopping at query suggestions, SPL Forge is intended to validate its own output against a Splunk environment, repair common failures, and package the final result into usable assets such as dashboards, alerts, saved searches, and app-ready files.

## Why SPL Forge

Building useful Splunk content still requires too much manual effort:

- Users know the question they want answered, but not always the exact SPL.
- Query failures often come from missing fields, incorrect sourcetypes, or environment-specific schema differences.
- Turning a working query into a dashboard, alert, or packaged app is still a separate workflow.
- Generic AI copilots can suggest SPL, but they do not reliably test and correct it against live Splunk data.

SPL Forge addresses that gap with an agentic, execution-aware development loop built for real Splunk workflows.

## What the Project Aims to Deliver

- Natural language to SPL generation for Splunk searches and detections
- Self-debugging query loop using execution feedback and schema introspection
- Support for Splunk-aware context such as indexes, sourcetypes, and fields
- Export flows for dashboards, alerts, reports, and lightweight app packaging
- Human-in-the-loop approvals before execution and export
- Demo-safe support for MCP, REST fallback, or mock environments

## Product Direction

According to the PRD, SPL Forge is being designed as:

- A VS Code extension with an optional companion web experience
- A practical agentic IDE for Splunk developers and analysts
- A hackathon-ready MVP focused on one polished end-to-end workflow
- A foundation for broader AI-native Splunk development operations

The initial demo scenario is centered on failed-login monitoring, where the system generates a query, detects or simulates an error, repairs it with schema context, previews results, and exports a dashboard or alert artifact.

## Intended Users

- Splunk app developers who want to move from idea to artifact faster
- Security analysts creating detection searches and dashboards
- SRE and DevOps teams building operational monitoring views under time pressure
- Splunk admins and platform engineers supporting repeatable content creation

## Architecture Snapshot

| Layer | Planned Approach |
|---|---|
| IDE | VS Code extension |
| Language | TypeScript and Node.js |
| UI | Webview-based interface, with optional web dashboard |
| Validation | Structured schema and artifact validation |
| Splunk connectivity | Splunk MCP Server, REST fallback, or mock connector |
| AI layer | Hosted models or provider adapters |
| Export | Dashboard, alert, report, and app-ready artifact generation |

## Current Status

This repository currently captures the product definition and roadmap for the MVP. It is best understood as the project foundation rather than a finished implementation.

Current repository assets:

- Product requirements in [`docs/PRD.md`](./docs/PRD.md)
- Delivery roadmap in [`docs/ROADMAP.md`](./docs/ROADMAP.md)
- Brand banner and repository presentation assets

## Documentation

- [Product Requirements Document](./docs/PRD.md)
- [Roadmap](./docs/ROADMAP.md)

## Vision

SPL Forge is built around one clear idea: Splunk development should feel more like describing intent and less like manually stitching together query syntax, dashboard configs, and packaging steps.

The long-term opportunity is an AI-native development layer for Splunk that can help teams generate, verify, explain, and operationalize Splunk content with far less friction and far more trust.

---

<div align="center">

**SPL Forge**  
From natural-language intent to validated Splunk artifacts.

</div>
