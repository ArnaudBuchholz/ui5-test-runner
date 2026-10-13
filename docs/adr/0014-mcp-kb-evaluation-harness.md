# ADR-0014: MCP Knowledge-Base Evaluation Harness

## Status

Accepted

## Context

[ADR-0011](./0011-mcp.md) makes the MCP mode a **documentation-only** server: its whole value is that an AI agent, handed the knowledge base, answers a user's question about `ui5-test-runner` correctly. Nothing in ADR-0011 verifies that it *does*. The KB can be perfectly structured and still give wrong answers — a fact can be missing, phrased too softly to act on, or sitting on an entity the triggering question never retrieves (the failure modes catalogued in ADR-0011's "What belongs in the KB vs. in a client").

Those failures are only visible end to end: feed a realistic project and question to an agent wired to the real MCP server, read the answer, and judge it against what a correct answer must contain. That is an **evaluation** concern, architecturally separate from the MCP mode itself (which is why it is not folded into ADR-0011), and it has its own non-obvious design problems:

- The thing under test is a **non-deterministic LLM answer scored by a non-deterministic LLM judge.** A single run proves nothing — a pass can be luck, a fail can be noise.
- Running the full case set on every change is slow and token-expensive; some cases are not worth stabilising yet.
- A finding has to be *actionable*: it must point at a specific KB entity (or client-prompt) gap, not just "the answer was bad."

## Decision

A standalone harness under `test/mcp/`, run with `npm run test:mcp -- --mcp <url> …`, drives the model-under-test against the live MCP server and scores it. It is **not** shipped in the product; it is a test/CI asset.

### LLM-as-judge, criterion-keyed

Each case is a `.toml` file: a `[user].question`, a `[files]` map of a synthetic project the agent may read only via a `read_file` tool (files are never injected into the prompt — probing is part of what is tested), and an `[expected]` table of **named criteria**, each a plain-language statement the answer must satisfy. A judge model receives the question, the agent's answer, and the criteria, and returns one verdict (`pass` + `rationale`) per criterion name. Case output is emitted as CTRF (`report/report.json`), one `CTRFTest` per criterion, so judge results reuse the project's existing report pipeline.

The judge contract is **exactly one verdict per declared criterion**. A judge response that omits a criterion is a hard error, not a silent `pass:false` — a missing verdict means *not evaluated*, which must never masquerade as a real failure.

### `--repeat <n>`: the diagnostic primitive

Because any single verdict is noisy, the harness can run every case `n` times; the repetition index is tagged into the CTRF suite (`migration/1/simple`) so runs stay distinguishable. This turns a yes/no into a **pass rate**, which is what makes a finding interpretable:

- **0/N (fails every repeat)** → a real, stable KB/prompt gap worth fixing.
- **mixed (flips run to run)** → judge wording noise or agent probing variance; *not* a bug to chase. The specific failing criterion rotates between runs, whereas a genuine gap stays pinned near 0.

This 0/N-vs-mixed reading is the harness's core method: it is how a real documentation defect is told apart from LLM variance before any fix is attempted, and how a fix is confirmed stable afterwards (re-run at `--repeat 3`, or 5 for probing-sensitive cases; then full-suite `--repeat 3` to catch regressions, since a scoping change can omit a topic another case needs).

### `meta.skip`: deferral without deletion

A case may carry `[meta] skip = true` (+ `skipReason`). It is recorded as a CTRF `skipped` test with **zero query/judge cost**, does not count as a failure, and runs **once** regardless of `--repeat`. This parks a case that is not yet relevant or stubbornly flaky (e.g. one stacking several wording-strict sub-criteria in a single answer) without losing it or letting it redden the suite.

### `--page-filter` reuse

Case selection reuses the product's own `pageFilter` (`-pf`) regexp option — matched here against each case path relative to `test/mcp/cases` — rather than inventing a bespoke flag, so filtering behaves identically to the runner and composes with `--repeat` and `meta.skip`.

### Case material

Realistic cases are cheap to derive from the real v5 batch configs on the `5.x.y` branch (`test/e2e/*.json`), each becoming a `ui5-test-runner.json` inside a case's `[files]`. A case should carry **few, loosely-worded criteria**: stacking many strict per-option assertions in one answer is inherently flaky and is better split or deferred than over-engineered.

## Consequences

### Positive
- ✅ **KB quality is measurable end to end**, not assumed — the one thing ADR-0011's value proposition rests on.
- ✅ **Findings are actionable**: a 0/N criterion names the exact missing/weak fact and the entity it belongs on.
- ✅ **Noise is separable from signal** via `--repeat`, so fixes target real gaps and are confirmed stable.
- ✅ **Cheap iteration**: `--page-filter` + `meta.skip` keep the inner loop fast and token-bounded.
- ✅ Reuses existing infrastructure (CTRF report pipeline, `pageFilter`, the v5 e2e configs).

### Negative/Trade-offs
- ❌ **Token cost**: every case is at least one agent call plus one judge call; `--repeat` multiplies it. Default repeat is 1; high repeats are for stability reads, not every run.
- ❌ **Residual judge noise**: even a healthy suite shows criteria wobbling at ~2/3 — a floor set by judge wording sensitivity, not a defect. Over-tightening criteria chases this noise.
- ❌ **Not a gate as-is**: because of that floor, a naive "all green" assertion is flaky; the suite is a diagnostic instrument first, and any CI gate must account for the noise floor (e.g. via repeat + threshold).

## Related Files & Modules

- **`test/mcp/cli.ts`** — harness entry point: argument parsing (`--mcp`, `--repeat`, `--page-filter`), case discovery, run expansion, CTRF assembly, `meta.skip` handling
- **`test/mcp/query.ts`** — the model-under-test agent: `SYSTEM_PROMPT` (client-only behaviour — probing, reference-following, answer scoping/format), `read_file` tool wiring
- **`test/mcp/judge.ts`** — LLM-as-judge: criterion-keyed verdict contract, strict missing-criterion error
- **`test/mcp/testCase.ts`** — `.toml` case loader (`[user]`, `[files]`, `[expected]`, `[meta]`)
- **`test/mcp/cases/**/*.toml`** — the case corpus
- **[ADR-0011](./0011-mcp.md)** — the MCP mode and KB this harness evaluates; its "What belongs in the KB vs. in a client" section records the fix patterns this harness surfaced
