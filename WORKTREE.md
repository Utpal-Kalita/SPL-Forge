# SPL Forge - Project Codebase & File Structure

## Project Overview

**SPL Forge** is an AI-native agentic IDE for Splunk that turns natural language into working SPL queries, dashboards, alerts, and deployable Splunk apps. It autonomously generates, tests, debugs, and fixes queries using the Splunk MCP Server.

- **Repository**: Utpal-Kalita/SPL-Forge
- **Language Composition**: JavaScript (70.2%), TypeScript (29.8%)
- **Type**: VS Code Extension
- **Status**: Foundation/MVP Development
- **License**: Not specified
- **Default Branch**: main

---

## Repository Structure

```
SPL-Forge/
├── .github/                    # GitHub configuration
├── .vscode/                    # VS Code settings
├── .gitignore                  # Git ignore rules
├── .vscode-test.mjs            # VS Code test configuration
├── .vscodeignore               # Files to ignore in extension packaging
├── assets/                     # Brand assets and images
│   └── spl-forge-banner.png    # Project banner
├── docs/                       # Documentation directory
│   ├── PROGRESS.md             # Progress tracking
│   ├── QUICKSTART.md           # Quick start guide
│   ├── VS_CODE_SETUP.md        # VS Code extension setup
│   ├── SPLUNK_SETUP.md         # Splunk environment setup
│   ├── ARCHITECTURE.md         # System architecture
│   └── DEMO_RUNBOOK.md         # Demo scenario walkthrough
├── src/                        # Source code directory
│   ├── extension.ts            # Main VS Code extension entry point
│   └── test/                   # Test directory
├── package.json                # Node.js project metadata
├── package-lock.json           # Dependency lock file
├── tsconfig.json               # TypeScript configuration
├── esbuild.js                  # Build configuration (esbuild)
├── eslint.config.mjs           # ESLint configuration
├── README.md                   # Main project documentation
├── CHANGELOG.md                # Version history
├── vsc-extension-quickstart.md # VS Code extension quickstart
├── ROADMAP.md                  # MVP and Future Roadmap
└── PRD.md                      # Product requirements (root level)
```

---

## Core Files & Purpose

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | NPM package configuration, dependencies, and build scripts |
| `tsconfig.json` | TypeScript compiler configuration |
| `esbuild.js` | Build script for bundling the extension |
| `eslint.config.mjs` | Code linting and style rules |
| `.gitignore` | Files/folders excluded from version control |
| `.vscodeignore` | Files excluded from VS Code extension package |

### Extension Entry Point

| File | Purpose |
|------|---------|
| `src/extension.ts` | Main VS Code extension activation and command registration |

### Documentation

| File | Purpose |
|------|---------|
| `README.md` | High-level project overview and vision |
| `PRD.md` | Detailed product requirements and specifications |
| `ROADMAP.md` | Development timeline and feature planning |
| `CHANGELOG.md` | Release notes and version history |
| `docs/ARCHITECTURE.md` | System design and technical architecture |
| `docs/DEMO_RUNBOOK.md` | Step-by-step demo workflow scenario |
| `docs/VS_CODE_SETUP.md` | Extension installation and configuration |
| `docs/SPLUNK_SETUP.md` | Splunk environment prerequisites |
| `docs/QUICKSTART.md` | Getting started guide |
| `vsc-extension-quickstart.md` | Quick setup for VS Code extension development |

---

## Development Stack

### Runtime
- **Node.js**: 22.x (per tsconfig)
- **VS Code**: ^1.120.0
- **Framework**: VS Code Extension API

### Languages
- **TypeScript** (29.8%): Primary language for modern development
- **JavaScript** (70.2%): Legacy/build files and configuration

### Build & Development Tools
- **esbuild**: Fast bundler for extension compilation
- **TypeScript**: ^5.9.3 - Type checking and transpilation
- **ESLint**: Code quality and style enforcement
- **npm-run-all**: Parallel script execution

### Testing
- **@vscode/test-cli**: VS Code test runner
- **@vscode/test-electron**: Electron-based testing
- **Mocha**: ^10.0.10 - Test framework
- **TypeScript**: Type checking for tests

### IDE & Type Definitions
- **@types/vscode**: VS Code API type definitions
- **@types/node**: Node.js type definitions
- **@types/mocha**: Mocha testing framework types

---

## Build & Development Scripts

From `package.json`:

```json
{
  "scripts": {
    "vscode:prepublish": "npm run package",          // Final production build
    "compile": "Check types, lint, and bundle",       // Development build
    "watch": "Run watch tasks in parallel",           // Auto-rebuild on file changes
    "watch:esbuild": "Watch esbuild bundling",        // Bundle watching
    "watch:tsc": "Watch TypeScript compilation",      // Type checking watching
    "package": "Production build with optimizations", // Final package build
    "compile-tests": "Compile test TypeScript files", // Build test suite
    "watch-tests": "Watch test compilation",          // Watch test files
    "pretest": "Setup before tests run",              // Pre-test setup
    "check-types": "Type checking without emission",  // TypeScript validation
    "lint": "ESLint source files",                    // Code quality check
    "test": "Run VS Code tests"                       // Execute test suite
  }
}
```

### Development Workflow

1. **Development**: `npm run watch` - Watches both esbuild and TypeScript
2. **Building**: `npm run compile` - Type check + lint + bundle
3. **Testing**: `npm test` or `npm run pretest` + `npm test`
4. **Production**: `npm run package` - Final optimized build

---

## Extension Configuration

From `package.json` - `contributes`:

### Activation Events
- `onCommand:spl-forge.openPanel` - Activates when user runs the command

### Commands
- **ID**: `spl-forge.openPanel`
- **Title**: "SPL Forge: Open Panel"
- **Purpose**: Opens the SPL Forge development panel

### Main Entry Point
- **Compiled Output**: `./dist/extension.js`
- **Engine**: VS Code ^1.120.0

---

## Architecture Layers

Based on README and PRD:

```
┌─────────────────────────────────────────┐
│          User Intent (Natural Language)  │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│    VS Code Extension UI (Webview)       │
├──────────────────┬──────────────────────┤
│  · Command Panel │ · Query Editor       │
│  · Result Viewer │ · Configuration      │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│      Agentic Processing Layer           │
├──────────────────┬──────────────────────┤
│ · Query Generator    · Debugger Loop    │
│ · Schema Inspector   · Repair Engine    │
│ · Artifact Builder   · Validator        │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│      Splunk Connectivity Layer          │
├──────────────────┬──────────────────────┤
│ · Splunk MCP     │ · REST API Fallback  │
│ · Mock Connector │ · Simulator          │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│      Splunk Instance / Environment      │
└─────────────────────────────────────────┘
```

---

## Core Workflow

The system follows this execution pattern:

```
Intent → Generate SPL → Execute → Inspect → Repair → Preview → Export
```

### Workflow Steps

1. **Intent Capture**: User describes desired outcome in natural language
2. **Generation**: AI generates initial SPL query
3. **Execution**: Query runs against live/mock Splunk environment
4. **Inspection**: System analyzes results and detects failures
5. **Repair**: Auto-corrects common issues (missing fields, schema mismatches)
6. **Preview**: User previews results before export
7. **Export**: Packages as dashboard, alert, report, or app artifact

---

## Intended Users

- Splunk app developers
- Security analysts
- SRE and DevOps teams
- Splunk admins and platform engineers

---

## Key Features (Planned)

- Natural language to SPL generation
- Self-debugging query loop with execution feedback
- Schema introspection and context awareness
- Dashboard, alert, and report export
- Lightweight app packaging
- Human-in-the-loop approval workflows
- MCP Server, REST, and mock environment support

---

## File Statistics

- **Total Files Tracked**: ~25+ (including test files, docs, config)
- **Source Code Files**: 1 main extension file + test directory
- **Configuration Files**: 5+ (TypeScript, ESLint, esbuild, package management)
- **Documentation Files**: 8+ in docs/ + root level documentation

---

## Development Status

**Current Phase**: Foundation/MVP Planning

- ✅ Project structure and documentation
- ✅ VS Code extension scaffold
- ✅ Build pipeline configured
- ⏳ Core agentic logic implementation
- ⏳ Splunk connector integration
- ⏳ Webview UI implementation
- ⏳ Demo scenario validation

---

## Getting Started for Developers

1. **Clone Repository**: `git clone https://github.com/Utpal-Kalita/SPL-Forge.git`
2. **Install Dependencies**: `npm install`
3. **Start Development**: `npm run watch`
4. **Run Tests**: `npm test`
5. **Build Package**: `npm run package`

Refer to `vsc-extension-quickstart.md` and `docs/VS_CODE_SETUP.md` for detailed setup instructions.

---

## Links & Resources

- **Main Repository**: https://github.com/Utpal-Kalita/SPL-Forge
- **Product Requirements**: [PRD.md](./PRD.md)
- **Roadmap**: [ROADMAP.md](./ROADMAP.md)
- **Architecture**: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

**Last Updated**: May 24, 2026  
**Repository Owner**: Utpal-Kalita  
**Visibility**: Private
