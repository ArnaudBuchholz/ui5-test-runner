# Contributing to ui5-test-runner

Thank you for your interest in contributing! This guide covers the essentials for both first-time contributors and regulars.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Dev Setup & Build](#dev-setup--build)
- [Tests & Linting](#tests--linting)
- [Submitting Issues & PRs](#submitting-issues--prs)
- [Adding Options or Features](#adding-options-or-features)
- [Contributing to the Knowledge Base (MCP)](#contributing-to-the-knowledge-base-mcp)

---

## Code of Conduct

Be respectful. This project follows the [Contributor Covenant](https://www.contributor-covenant.org/version/3/0/code_of_conduct/).

---

## Dev Setup & Build

**Prerequisites:** [Node.js](https://nodejs.org/) >= 24.11.1 (a `.nvmrc` is provided).

```sh
git clone https://github.com/ArnaudBuchholz/ui5-test-runner.git
cd ui5-test-runner
npm install
```

### First-time browser installation

The unit and e2e tests drive real browsers. Install them once:

```sh
make browsers
```

### Building

```sh
npm run build
# or, to rebuild everything from scratch:
make precli -B
```

The build compiles the CLI, the in-browser agent, the UI bundles, the options module, and the KB index. Individual targets:

| Target | Command |
|---|---|
| All (recommended) | `make precli -B` |
| CLI only | `npm run build:cli` |
| Options (after editing a doc) | `make options` |
| KB index | `npm run build:kb-index` |

### Running the CLI locally

```sh
npm run cli -- [options]
```

---

## Tests & Linting

### Full suite (what CI runs)

```sh
npm test
# equivalent to: npm run lint && npm run test:unit && npm run test:e2e
```

### Unit tests only

```sh
npm run test:unit
# or in watch mode:
npm run test:unit:watch
```

Unit tests use [Vitest](https://vitest.dev/) and live alongside source files (`Foo.ts` → `Foo.spec.ts`).

### E2E tests

```sh
npm run test:e2e
```

Runs the test runner against the sample projects under `test/e2e/`. Requires a local server (started automatically via `--start serve`).

### MCP judge harness

```sh
npm run test:mcp
```

Evaluates the MCP knowledge-base answers with an LLM-as-judge. See [ADR-0014](docs/adr/0014-mcp-kb-evaluation-harness.md) for details.

### Linting

```sh
npm run lint
```

This runs circular-dependency detection (`dpdm`), ESLint (auto-fix), Prettier (auto-format), and TypeScript type checking in one command. Run it before opening a PR.

### What CI checks

The GitHub Actions workflow (`.github/workflows/node.js.yml`) runs `npm test` on every push and PR. All checks must pass before merging.

---

## Submitting Issues & PRs

### Bug reports

Use the [bug report template](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/new?template=bug_report.md). The most useful thing you can include is the `report.html` from the failed run — it contains structured data, logs, and traces.

### Feature requests

Use the [feature request template](https://github.com/ArnaudBuchholz/ui5-test-runner/issues/new?template=feature_request.md).

### Pull requests

1. **Fork** the repo and create a branch from `main`.
2. Keep the scope focused — one concern per PR.
3. Make sure `npm test` passes locally.
4. If you add or change user-facing behavior, update the relevant `docs/` files (see [Adding Options or Features](#adding-options-or-features) and [Contributing to the Knowledge Base](#contributing-to-the-knowledge-base-mcp)).
5. Describe *why* in the PR body, not just what changed.

**Commit style:** conventional commits are preferred (`feat:`, `fix:`, `refactor:`, `doc:`, `test:`).

---

## Adding Options or Features

### Adding a new CLI option

Options are **never edited directly** in `src/configuration/options.ts` — that file is generated. The workflow is:

1. Create a doc file under `docs/options/<optionName>.md` with the required frontmatter (see any existing option doc for the format, e.g. [`docs/options/batch.md`](docs/options/batch.md)).
2. Run `make options` to regenerate `src/configuration/options.ts` and related files.
3. Implement the feature; write unit tests.
4. Run `npm test`.

See [ADR-0003](docs/adr/0003-configuration-validation-strategy.md) for the configuration architecture.

### General guidelines

- Follow the [Coding Guidelines](CODING_GUIDELINES.md) — naming, file structure, TypeScript strict mode, no default exports, `as const` instead of enums.
- New dependencies must be MIT-licensed and themselves dependency-free.
- Max file size signal: 200 lines. The limit prompts a cohesion question, not a hard rule — see the guidelines for when splitting is and isn't appropriate.
- Relevant [Architecture Decision Records](docs/adr/index.md) are listed in the ADR index alongside pointers to which area of the code each one governs — check the "Quick Navigation" section before touching a subsystem.

---

## Contributing to the Knowledge Base (MCP)

The `--mcp` mode serves the `docs/` folder as a knowledge base to AI assistants. Every markdown file in `docs/` with valid frontmatter becomes a KB entity ([ADR-0011](docs/adr/0011-mcp.md)).

### Frontmatter format

```yaml
---
"#type": <entity type>   # e.g. option, mode, concept, adr
title: <display title>
summary: <one-line description used by list_topics>
keywords:
  - keyword1
  - keyword2
relations:
  affects:
    - path/to/related/entity
---
```

The body is plain markdown. The `summary` field is what MCP clients see in `list_topics` — make it precise and self-contained.

### Validating the KB

```sh
npm run build:kb-index
```

This validates every entity (required fields, no duplicate IDs, no dangling relation edges) and writes `kb-index.json`. The build fails with a clear error message if anything is invalid.

### Testing KB answers

After updating docs, run the MCP judge harness to check that answers are still accurate:

```sh
npm run test:mcp
```

See [ADR-0014](docs/adr/0014-mcp-kb-evaluation-harness.md) for how to write or update judge criteria.
