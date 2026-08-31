# Assuming I want to convert the docs folder in a Knowledge base for ui5-test-runner and be able to answer any question using LLM, can you identify what is missing in the actual documents ?

After reading through all docs — user guides, option pages, ADRs, internal planning files, and the presentation deck — here's a structured assessment of what's missing, inconsistent, or in the wrong place.

---

## 🔴 Completely empty / stub files

These are the highest-priority gaps — they register as topics but deliver zero content to an LLM.

| File | What's there | What should be there |
|---|---|---|
| `debug.md` | A single heading | Entire debugging & troubleshooting guide: `--debug-log`, `--log`/`--log-dump`/`--log-filter` workflow, `--debug-keep-browser-open`, how to read trace files, interpreting `console.csv` / `network.csv` |
| `modes/remote.md` | 1 line (title only) | Remote mode guide — the content actually lives in `testing.md` at the root; these two files need to be reconciled |
| `v2.md` → "Version 2" section | 3 headings with no body | What v2 actually delivers: improved reporting, tracing, and browser support |
| `coverage.md` → "Legacy mode" section | One sentence | How local instrumentation works (source files manipulation, nyc, the 4-phase pipeline) |

---

## 🟠 Topics with no dedicated documentation

These are entire question categories that a user would reasonably ask, with no doc to answer from.

### 1. Getting started / quickstart
There is no "here's how to run your first test" document aimed at a new user. `demo.md` is a presentation script, not a quickstart. An LLM asked "how do I set up ui5-test-runner?" would have to piece it together from `usage.md` + `modes/legacy.md`.

### 2. Report output structure
Users will ask: *"What files does ui5-test-runner produce?"*, *"What's in `report.json`?"*, *"How do I consume the CTRF output in CI?"*. There is no document describing the output directory, the CTRF JSON schema, the `report.html` viewer, or what `console.csv` / `network.csv` / `browser.json` / `stdout.txt` / `stderr.txt` contain. This information is scattered across `demo.md` (operational walk-through) and `adr/0004` (architecture notes) — neither is a user reference.

### 3. Trace / log viewer usage
The new `--log` / `--log-dump` / `--log-filter` system is a major v6 feature but completely undocumented from a user perspective. The ADRs describe the `.logz` format and the filtering expression language (`punyexpr`) internally, but there is no user-facing guide explaining how to open a trace file, filter it, or pipe it to `jq`.

### 4. MCP mode usage
`--mcp` appears in `options.md` and is architecturally documented in `adr/0011-mcp.md`, but there is no user guide covering: how to start the MCP server, how to connect an AI client to it, what the three tools (`run`, `getStatus`, `cancel`) do, or the one-active-execution constraint.

### 5. CI/CD integration guide
No document addresses the typical CI use case: exit codes, CTRF-to-JUnit conversion, reporting integration, `--ci` flag, `--output-interval` for log streaming, `--fail-fast` behaviour in pipelines.

### 6. Migration guide (v5 → v6)
As already established, this simply doesn't exist yet. Given the volume of breaking changes, it's a high-value gap.

### 7. `--if` / `punyexpr` expression syntax
The `--if` option is used in batch mode for conditional execution. Its expression language (`punyexpr`) is mentioned by name in the ADRs with example snippets (`NODE_MAJOR_VERSION >= 20`, `E2E_IGNORE_BROWSER !== 'true'`), but never formally documented for users. An LLM would have no reliable basis to answer *"how do I write a conditional batch item?"*.

---

## 🟡 Thin or inconsistent option documentation

### Option pages are mostly frontmatter-only
The `options/` directory follows a YAML frontmatter + optional prose pattern. The richer options (`start.md`, `coverage.md`, `coverageSettings.md`) have good prose and cross-references. But the majority — especially `url.md`, `browser.md`, `pageFilter.md`, `parallel.md`, `splitOpa.md` — are pure frontmatter with no explanation or examples. An LLM answering *"how do I filter test pages?"* would only get a one-line description and no regex examples.

### `types/browser.md` lists only puppeteer
The `browser` type page is supposed to document all browser selection values, but only mentions `puppeteer`. There are five browser adapters (`puppeteer`, `playwright`, `jsdom`, `selenium-webdriver`, `webdriverio`) — none of the others appear in the type reference.

### Type stubs: `url`, `integer`, `string`, `enumeration`
These type pages are single-line entries. They give no guidance on accepted formats, constraints, or what happens on invalid input. Fine for a human scanning docs, but a liability for an LLM that needs to answer *"can I use a relative URL here?"* or *"does pageTimeout accept seconds?"*.

---

## 🔵 Content consistency issues

These are cases where different documents contradict each other or reference things that no longer exist.

| Issue | Files involved |
|---|---|
| `demo.md` and `tipsNtricks.md` reference `--report-generator`, `--capabilities`, `--coverage-proxy`, `--disable-ui5`, `--screenshot-on-failure`, `--cache` — none of which appear in `options.md` | `demo.md`, `tipsNtricks.md`, `options.md` |
| `mapping_v1_v2.md` maps v1 options to v2 counterparts like `--watch`, `--log-server`, `--browser-retry`, `--screenshot` — all of which have since been removed in v6 | `mapping_v1_v2.md`, `options.md` |
| `testing.md` (root level) contains the "remote mode" content, but `modes/remote.md` is the intended home and is an empty stub — creates duplication risk | `testing.md`, `modes/remote.md` |
| `warnings.md` references `SKPNYC`/`COVMIS`/`COVORG`/`COVALL` warnings tied to remote coverage features that are **deferred in v6** | `warnings.md`, `coverage.md` |
| `tipsNtricks.md` has a time-stamped BAS tip ("as of March 2025") that will go stale | `tipsNtricks.md` |

---

## 🔵 ADR content not surfaced in user docs

The ADRs contain substantial user-facing information that currently has no home in the end-user documentation. An LLM ingesting only the user-facing docs would miss:

- **Config priority order**: CLI args override config file, which overrides defaults (ADR-0003)
- **Agent lifecycle**: the 7-step sequence from page launch to result collection (ADR-0002)
- **CTRF report schema**: what fields are in `report.json` (ADR-0004)
- **Log source table**: what each trace source name means (ADR-0005)
- **`batchForwarded` semantics**: which options propagate to child batch processes (ADR-0006)
- **Coverage 4-phase pipeline**: instrument → execute → collect → report (ADR-0009)

---

## 🟣 Internal files that should be excluded from the knowledge base

These files exist in the docs folder but are developer/planning artefacts — including them would cause an LLM to confuse internal implementation plans with shipped behaviour.

| File | Reason to exclude |
|---|---|
| `prompts/batch_pr1.md` | Ephemeral PR review notes |
| `prompts/batch_plan.md` | Implementation planning notes |
| `prompts/UI Controller Guidelines.md` | AI prompt template with `{{placeholders}}` |
| `prompts/v5 coverage.md` | v5 internal porting reference, superseded |
| `prompts/v6 coverage.md` | v6 implementation plan, not shipped docs |
| `decks/2026 DCOM.md` | Conference deck — informal voice, preliminary data |
| `prompts/research/` (entire folder) | Research and design exploration |
| Internal ADR sections (implementation details, file paths, source internals) | Only the architectural decisions and their user-facing consequences are relevant |

The performance benchmarks and architecture comparison from `decks/2026 DCOM.md` are worth extracting into a dedicated "what's new in v6" or "why v6?" page, but the raw deck shouldn't be ingested as-is.

# Assuming a developer would like to contribute to this version (and provided we cover the identified gaps) is this knowledge base suitable ?

The short answer: **no, not yet** — but you're closer than you might think. The docs are well-structured as a *user* knowledge base, and the ADRs provide genuine architectural depth. But for a contributor, several entire categories of knowledge are either absent or too scattered to be reliably retrieved by an LLM.

Here's the full picture.

---

## What the docs do well for contributors

The 11 ADRs collectively cover a lot of ground that contributors need:

- **Add a config option** (ADR-0003) — explicitly documented: edit `docs/options/<name>.md` → run `make options` / `npm run build:options`; the three generated files (`src/configuration/options.ts`, `validations.ts`, `src/agent/Configuration.ts`) must never be edited by hand
- **Platform API rules** (ADR-0001) — always import from `src/platform/index.js`, never from `node:fs`, `node:http`, etc. directly; `src/platform/mock.ts` is imported as a side-effect in spec files to activate all Vitest mocks
- **Logging conventions** (ADR-0005) — 6 hard rules: always include `source` + `message`; errors go in `error` field (not `message`); page-scoped events must include `pageId`; structured context goes in `data`; high-frequency events use `debug`; never use `console.*` in application code
- **Add a UI controller** (ADR-0008) — typed template with `AbstractUserInterfaceController<Settings, State, Actions>`, concrete TypeScript code examples, and testing guidance (suppress `🎮`-prefixed `console.log` in tests via `vi.spyOn`)
- **Architecture source map** — ADRs collectively name most source directories: `src/platform/`, `src/browsers/`, `src/agent/`, `src/modes/`, `src/configuration/`, `src/types/`, `src/reports/`, `src/ui/`, `src/utils/`, `build/`
- **Testing framework** — Vitest is consistently named; `*.spec.ts` co-located with sources; `vi.mock()` / `vi.spyOn()` patterns shown

That's a solid foundation. The conventions are consistent and the ADRs are the kind of architectural documentation that genuinely helps an LLM write coherent code.

---

## What's missing — critical gaps for contributors

### 1. No development setup guide
There is nothing in the docs that answers: *"I just cloned the repo — what do I do next?"* No Node.js version requirement, no `npm install` command, no explanation of whether a global or local install is expected, no mention of any prerequisites beyond what you'd infer from the tech stack. An LLM helping a contributor set up a dev environment would be guessing.

### 2. No project structure document
While ADRs mention many paths, no single file gives a structured tree with a one-line purpose per directory. A contributor asking *"where does X live?"* would have to piece it together from multiple ADRs. There's also no explanation of the `build/` directory role (code generators), the `dist/` output structure, or the distinction between `src/ui/` (browser-side code) and `src/modes/` (CLI-side code).

### 3. No full build guide
The only build command documented is `make options`. How to compile TypeScript, how to build the Vite UI bundles, how to run a full build from scratch — none of this is documented. The build sequence matters: `make options` must run before `tsc`, and Vite must build before the HTML report can embed the frontend. An LLM has no basis to answer *"how do I build the project?"*

### 4. No test-running guide
Vitest is named but never explained operationally: no `npm test` command, no `npm run test:watch`, no description of what the test suite covers, no guidance on running a single spec file. A contributor adding a feature has no documented path to validating their work.

### 5. No "how to add a browser adapter" guide
ADR-0002 names `src/browsers/IBrowser.ts` and lists the interface, but there's no step-by-step guide for implementing a new browser adapter. This is a high-complexity contribution — the docs should walk through what methods to implement, how to register the adapter, and how to test it with `--capabilities`.

### 6. `punyexpr` is undocumented
This expression language is used in two places visible to users (`--if` in batch mode, `--log-filter` in the log viewer) and in contributor code. There is no reference for its syntax, operators, available variables, or how to test expressions. Any question about *"how do I write an `--if` condition?"* has no reliable source.

### 7. The `add-option` skill is mentioned but not documented
ADR-0003 explicitly refers to an `add-option` skill that "encodes the correct workflow so contributors don't bypass the generator." But there is no documentation of what this skill is, where it lives, or how to use it. A contributor who finds this reference has no way to follow up.

### 8. No CONTRIBUTING.md equivalent
There is no single entry-point document covering: PR conventions, commit message style, branch naming, how to open a bug report, how to propose a new feature, what level of test coverage is expected, and who reviews what. A contributor knowledge base without this is navigable by an expert but not by someone new to the project.

### 9. No CI/release process documentation
No description of what GitHub Actions runs on a PR, what needs to pass before merge, how versions are bumped (manual? semantic-release?), or what triggers a publish to npm. For a contributor asking *"is my PR ready to merge?"*, there's no checklist to consult.

### 10. `platform/README.md` is referenced but not in the docs folder
ADR-0001 notes that thin platform wrappers are intentionally untested and that this is explained in `platform/README.md`. This file exists in the source tree but not the docs — so the rationale is lost for anyone reading only the knowledge base.

---

## Files that should be excluded from a contributor knowledge base

Beyond the user-KB exclusions already identified, the research files in `prompts/research/` are AI chat transcripts (Duck.ai/GPT-5 conversations used to explore designs). They contain real source paths and TypeScript types, which could confuse an LLM into treating exploratory drafts as settled implementation. They're useful internal context but should not be ingested as-is — the decisions they led to are already captured in ADR-0008.

---

## Summary verdict

| Category | User KB | Contributor KB |
|---|---|---|
| Architecture & design decisions | ✅ Good (11 ADRs) | ✅ Good |
| Coding conventions | ✅ Present in ADRs | ✅ Present, but scattered |
| Specific contribution workflows (add option, add UI) | ✅ Explicitly documented | ✅ Explicitly documented |
| Development setup | ❌ Missing | 🔴 Critical gap |
| Build & test commands | ❌ Missing | 🔴 Critical gap |
| Project structure map | ❌ Missing | 🔴 Critical gap |
| New browser adapter guide | ❌ Missing | 🟠 High-value gap |
| CI / release process | ❌ Missing | 🟠 High-value gap |
| `punyexpr` reference | ❌ Missing | 🟠 Needed in two places |
| PR / contribution process | ❌ Missing | 🟡 Standard but absent |

The ADRs are a genuine asset — most projects don't have anything like them. If you fill the five critical gaps (dev setup, build guide, test guide, project structure, CONTRIBUTING), the knowledge base would be a strong foundation for an LLM-assisted contributor workflow. Without them, a contributor LLM will get the architecture right but be unable to execute basic tasks like running tests or building the project.

# Last but not least, is there any question related to ui5-test-runner that could be asked which is not covered yet ? For instance, if someone new to it ask what it does ?

Yes, substantially. Even setting aside the gaps already identified, there are **48 question categories** that a reasonable person would ask about ui5-test-runner that the current docs can't reliably answer. Here's the full picture, organized by persona.

---

## 🔴 Newcomer (10 questions — all critical)

This is the most damaging gap. The very first questions someone asks aren't answered.

| Question | Current state |
|---|---|
| **What is ui5-test-runner?** | A 3-line README summary. No elevator pitch, no "why does this exist", no positioning. |
| **How is it different from Karma?** | Karma is mentioned as deprecated context in `demo.md`. No comparison. |
| **How is it different from plain Playwright / Jest?** | Not addressed anywhere. |
| **How is it different from `@ui5/cli test` or wdi5?** | Not addressed. |
| **How do I install it?** | One command buried in `demo.md`. No dedicated install page. |
| **What's the minimum config to run my first test?** | No quickstart. `demo.md` is a presentation script, not a tutorial. |
| **What Node.js versions are supported?** | `tipsNtricks.md` mentions a Node 17+ IPv6 quirk. No compatibility matrix. |
| **What UI5 versions are supported?** | Not documented. |
| **Does it work with OPA5 / TypeScript tests?** | OPA5 is mentioned; QUnit is assumed; TypeScript test files never explicitly confirmed. |
| **What OS / environments are supported?** | Not documented. |

The "what is it?" question is the starkest example. The README gives: *"A self-sufficient test runner for UI5 applications enabling parallel execution of tests."* That's accurate but it doesn't tell a developer: why would I use this instead of what I'm already using? An LLM would have to fabricate an answer to that.

---

## 🔴 Troubleshooting (9 questions — mostly high severity)

`debug.md` is completely empty. This means an entire class of common questions has zero coverage.

| Question | Current state |
|---|---|
| **My tests pass locally but fail in CI** | No doc. |
| **The runner hangs / never finishes** | No doc. |
| **Browser won't start / crashes immediately** | No doc. |
| **Coverage shows 0% for all files** | `COVMIS` warning exists in `warnings.md` with a description but no remediation steps. |
| **How do I see what's happening inside the browser?** | `tipsNtricks.md` mentions `--browser-visible` and `--debug-keep-browser-open` in passing. No systematic debugging guide. |
| **How do I read / filter trace files?** | ADR-0005 documents the `.logz` format and `punyexpr` filtering — but that's internal architecture, not a user guide. |
| **I'm getting COVMIS / BRWCPE / HDLEAK — what do I do?** | `warnings.md` describes what each code means. No remediation. |
| **Tests are flaky / non-deterministic** | No guide. |
| **Node IPv6 ECONNREFUSED issue** | One bullet in `tipsNtricks.md`. |

---

## 🔴 v5 → v6 Migration (6 questions)

These questions are particularly dangerous because an LLM trained on the current docs would give wrong answers — describing v5 behaviour as if it still applies.

| Question | Current state |
|---|---|
| **What's new in v6?** | In the DCOM presentation deck (internal). No user-facing "what's new" page. |
| **Is v6 stable / released yet?** | Not documented. The DCOM deck says "around the corner". |
| **What features were removed from v5?** | Scattered across individual option pages. No consolidated list. |
| **Screenshots worked in v5 — what do I use instead?** | Screenshot options are silently removed. No user-facing explanation. |
| **Remote coverage worked in v5 — why not in v6?** | ADR-0009 says "deferred". No user-facing explanation. |
| **`--report-generator` is gone — how do I customize reports?** | Removed. No alternative documented. |

---

## 🔴 Operational (10 questions — 4 high severity)

| Question | Current state |
|---|---|
| **How do I integrate with GitHub Actions / Azure DevOps / Jenkins?** | No CI guide. No YAML examples. |
| **What exit codes does it return?** | ADR-0010 mentions 130/143 for SIGINT/SIGTERM. Normal pass/fail exit codes never documented for users. |
| **What files are in the report folder? How do I read the CTRF output?** | `demo.md` lists file names operationally. No reference doc for the CTRF schema. |
| **Can I get JUnit XML output?** | ADR-0004 explicitly says no JUnit in v6. This is never stated in any user-facing doc — a user will just search for the option and find nothing. |
| **Can I run it in Docker?** | `selenium-webdriver.md` has a Docker section. No general Docker guide. |
| **How do I run only a subset of test pages?** | `--page-filter` exists; no guide with regex examples. |
| **How do I configure it in a monorepo?** | Batch mode covers multi-project; monorepo-specific structure never addressed. |
| **Does it support test retries?** | Not documented. `--browser-retry` existed in v5, removed in v6 with no replacement noted. |
| **How do I pass environment variables to my tests?** | `--env` removed in v6; the `start` command env-prefix syntax is mentioned in `start.md` but no guide. |
| **What is the progress page?** | Its URL (`/_/progress.html`) is in the README. Never formally documented. |

---

## 🟡 Conceptual (7 questions)

| Question | Current state |
|---|---|
| **Legacy mode vs remote mode — which should I use?** | Two separate docs but no comparison or decision guide. |
| **What is CTRF and why does ui5-test-runner use it?** | Appears in option names and ADRs; never explained to users. |
| **What is `punyexpr` and how do I write `--if` expressions?** | Used in `--if` (batch mode) and `--log-filter`. Syntax never documented anywhere. |
| **When should I use batch mode vs just `--parallel`?** | `modes/batch.md` explains batch; no "when to choose" guidance. |
| **What does `--split-opa` do and when should I use it?** | One-sentence option page. No guide, no examples. |
| **How does the runner detect QUnit tests?** | ADR-0002 covers the poll model. Not surfaced in user docs. |
| **What is the in-page agent?** | ADR-0002. Not surfaced in user docs. |

---

## 🟡 Performance (3 questions)

None of these are answered:

- **How do I choose the right `--parallel` value?** — default is 2, no guidance on tuning
- **Why are my tests slower with higher parallelism?** — DCOM deck explains this ("parallelism doesn't scale well beyond a point"), but it's not in user docs
- **How does browser caching work in v6?** — DCOM deck mentions native browser cache reuse; no user doc

---

## 🟡 Comparison (3 questions)

- **Which browser adapter should I choose?** — each adapter is documented individually; no side-by-side comparison or recommendation matrix
- **Headless vs. headed — any differences beyond visibility?** — not covered
- **When should I actually use jsdom?** — `jsdom.md` says "not recommended"; no guidance on the edge cases where it makes sense

---

## The single most important missing document

If you had to write just one thing to make the knowledge base dramatically more useful, it's a **"What is ui5-test-runner and why would I use it?"** page — a proper introduction that covers:

1. The one-paragraph pitch (what problem it solves)
2. How it compares to Karma / plain Playwright / `@ui5/cli`
3. The three modes (legacy, remote, batch) in two sentences each
4. A minimal 3-command quickstart (install → run → see results)
5. A compatibility table (Node.js versions, UI5 versions, OS)

Without that page, an LLM answering a first-timer's question either fabricates context or gives a technically accurate but context-free answer that doesn't help the person decide whether to adopt the tool.