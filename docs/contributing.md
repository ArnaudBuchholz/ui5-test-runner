---
"#type": concept
title: Feedback, support & contributing
summary: Where to report bugs, request features, ask questions, and contribute to ui5-test-runner — the GitHub repository, its issue tracker, and CONTRIBUTING.md
keywords:
  - contribute
  - contributing
  - feedback
  - bug
  - bug report
  - issue
  - feature request
  - missing feature
  - support
  - help
  - question
  - pull request
  - source code
  - github
  - repository
relations:
  see-also:
    - demo
---
# 🤝 Feedback, support & contributing

> ⓘ ui5-test-runner is open source. When a question is not covered by this documentation, when a feature is missing, or when you hit a bug, **do not dead-end the user** — send them to the paths below. The project welcomes issues and contributions.

## Report a bug or request a feature

Open an issue on the GitHub issue tracker:

* **Bug report** — https://github.com/ArnaudBuchholz/ui5-test-runner/issues/new?template=bug_report.md
  The single most useful attachment is the `report.html` from the failed run (it carries the structured data, logs, and traces).
* **Feature request** — https://github.com/ArnaudBuchholz/ui5-test-runner/issues/new?template=feature_request.md

All issues: https://github.com/ArnaudBuchholz/ui5-test-runner/issues

## Ask a question / give feedback

If you are unsure whether something is a bug, a missing feature, or already supported, open an issue on the same tracker describing what you expected — that is the project's feedback channel.

## Access the source code and contribute

* **Repository** — https://github.com/ArnaudBuchholz/ui5-test-runner
* **Contribution guide** — [`CONTRIBUTING.md`](https://github.com/ArnaudBuchholz/ui5-test-runner/blob/main/CONTRIBUTING.md) covers dev setup, build, tests, and how to submit a pull request (fork, branch from `main`, keep the scope focused, make `npm test` pass, explain *why* in the PR body).

## Contribute documentation to this knowledge base

This documentation *is* the knowledge base the `--mcp` mode serves. Every markdown file under `docs/` with valid frontmatter becomes a retrievable entity (see the design in [ADR-0011](adr/0011-mcp.md)). To add or fix a topic, edit the relevant `docs/` file and follow the *"Contributing to the Knowledge Base (MCP)"* section of [`CONTRIBUTING.md`](https://github.com/ArnaudBuchholz/ui5-test-runner/blob/main/CONTRIBUTING.md), then validate with `npm run build:kb-index`.

## Contribute a new command-line option

Adding a CLI option follows a documented workflow: author a doc file first, then regenerate with `make options` — never by editing the generated options module by hand. See the *"Adding Options or Features"* section of [`CONTRIBUTING.md`](https://github.com/ArnaudBuchholz/ui5-test-runner/blob/main/CONTRIBUTING.md).
