# SPL Forge Progress

Actual repo status as of 2026-05-24.

## Overall State

SPL Forge currently exists as product definition, setup documentation, and demo planning. Implementation repository structure for extension and runtime logic does not exist yet.

## Completed

- [x] Repository banner and presentation assets added
- [x] Main project README rewritten and aligned with product direction
- [x] Product requirements document added in [`PRD.md`](./PRD.md)
- [x] Roadmap added in [`ROADMAP.md`](./ROADMAP.md)
- [x] Quickstart guide added in [`QUICKSTART.md`](./QUICKSTART.md)
- [x] VS Code setup guide added in [`VS_CODE_SETUP.md`](./VS_CODE_SETUP.md)
- [x] Free trial setup guide added in [`FREE_TRIAL_SETUP.md`](./FREE_TRIAL_SETUP.md)
- [x] Splunk setup guide added in [`SPLUNK_SETUP.md`](./SPLUNK_SETUP.md)
- [x] Architecture overview added in [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- [x] Demo runbook added in [`DEMO_RUNBOOK.md`](./DEMO_RUNBOOK.md)

## Not Started Yet

- [ ] VS Code extension scaffold
- [ ] `src/` implementation directory
- [ ] command registration for SPL Forge inside VS Code
- [ ] prompt input panel or webview UI
- [ ] LLM integration
- [ ] Splunk MCP integration
- [ ] Splunk REST fallback integration
- [ ] mock execution mode implementation
- [ ] schema inspection flow
- [ ] self-repair query loop
- [ ] result preview UI
- [ ] dashboard export generation
- [ ] alert export generation
- [ ] saved search packaging
- [ ] Splunk app packaging
- [ ] tests

## MVP Readiness Snapshot

| Area | Status | Notes |
|---|---|---|
| Product framing | Done | PRD and roadmap present |
| Repo presentation | Done | README and docs cleaned up |
| Setup guidance | Done | VS Code and Splunk guides present |
| Demo planning | Done | Runbook present |
| Architecture direction | Done | High-level plan present |
| Extension code | Not started | No source files yet |
| Splunk connectivity | Not started | No MCP or REST code yet |
| Agent workflow | Not started | No generation or repair logic yet |
| Artifact export | Not started | No packaging code yet |
| Testing | Not started | No test setup yet |

## Reality Check

If someone clones repo now, they get strong planning and setup docs, not working product implementation yet.

## Next Logical Build Order

1. Scaffold VS Code extension
2. Add prompt command and panel
3. Add mock-mode query loop
4. Add live Splunk adapter
5. Add repair loop
6. Add export flow
