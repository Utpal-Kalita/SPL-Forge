# Contributing to SPL Forge

Thanks for contributing. This project currently centers on product framing, setup planning, and MVP direction.

## What Good Contributions Look Like

- improve clarity of product docs
- tighten MVP scope
- add implementation-ready technical notes
- reduce ambiguity in setup and demo flow
- keep repo clean and presentation-ready

## Before You Contribute

Read first:

1. [`PRD.md`](./PRD.md)
2. [`ROADMAP.md`](./ROADMAP.md)
3. [`ARCHITECTURE.md`](./ARCHITECTURE.md)

## Contribution Rules

- Keep changes focused
- Do not add secrets
- Do not overpromise unfinished features
- Match existing product direction unless proposing explicit revision
- Prefer practical documentation over generic filler

## Suggested Branch Naming

```text
docs/readme-refresh
docs/setup-guides
feat/vscode-scaffold
feat/splunk-adapter
```

## Commit Style

Recommended examples:

```text
docs: add VS Code and Splunk setup guides
docs: clarify MVP architecture
feat: scaffold VS Code extension entry point
```

## Pull Request Expectations

Include:

- short summary
- why change matters
- screenshots if UI involved
- follow-up work if incomplete

## Review Focus

Reviewers should check:

- alignment with PRD
- realism of roadmap claims
- technical consistency
- demo usefulness
- clarity for new contributors

## Documentation First

If implementation changes product behavior, update docs in same change set when possible.

## Security and Secrets

- Never commit API keys
- Never commit Splunk tokens
- Redact tenant-specific URLs if needed
- Use local env or secret storage

## Questions to Ask Before Big Change

- Does this help MVP story?
- Does this improve trust?
- Does this reduce demo risk?
- Does this align with Splunk-first workflow?

## Related Docs

- [`QUICKSTART.md`](./QUICKSTART.md)
- [`VS_CODE_SETUP.md`](./VS_CODE_SETUP.md)
- [`SPLUNK_SETUP.md`](./SPLUNK_SETUP.md)
