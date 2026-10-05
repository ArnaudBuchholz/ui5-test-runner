# MCP validation harness

Connects an LLM to the ui5-test-runner MCP server and lets it answer a question using the
server's tools (`list_topics`, `get_topic`), then scores the answer against the
test case's `[expected]` criteria with a second LLM (the judge).

- **Step 1 — query** — the model under test answers the question using the MCP tools.
- **Step 2 — judge** — if the `JUDGE` env var is set and the case defines `[expected]`
  criteria, the judge grades the answer (one PASS/FAIL + rationale per criterion). The run
  exits non-zero if any case fails.

Every case passed on the command line is run, or — when none is given — every `*.toml`
found recursively under `test/mcp/cases/`.

## Configure

Install the harness dependency once:

```
npm install
```

Set the LLM configuration as JSON env vars (in a root `.env` or the shell):

```
TEST_OPENAI_CONFIG={"apiKey":"...","baseUrl":"...","model":"..."}
JUDGE_OPENAI_CONFIG={"apiKey":"...","baseUrl":"...","model":"..."}
```

`TEST_OPENAI_CONFIG` is the model under test; `JUDGE_OPENAI_CONFIG` is the grader — they
can point at different models/providers. Any OpenAI-compatible endpoint works (OpenRouter,
a local gateway…). The harness exits with an error if a required config is
missing or not valid JSON. Judging is opt-in: it only runs when the `JUDGE` env var is set
(and `JUDGE_OPENAI_CONFIG` is then required for cases that have `[expected]` criteria).

## Run

1. Start the MCP server in one terminal (default port 3000):

   ```
   npm run cli -- --mcp
   ```

2. Run the harness against one or more test cases in another terminal (omit the case path
   to run every case under `test/mcp/cases/`):

   ```
   npm run mcp:harness -- --mcp http://localhost:3000/mcp test/mcp/cases/demo.toml
   npm run mcp:harness -- --mcp http://localhost:3000/mcp          # all cases
   JUDGE=1 npm run mcp:harness -- --mcp http://localhost:3000/mcp   # all cases, graded
   ```

Each run writes to a per-run base folder, `test/mcp/logs/<timestamp>/`, with one sub-folder
per test case containing: the numbered request/response and tool-call JSON traces, the
assistant answer as `answer.txt`, and the token usage as `tokens.json`. The terminal shows
only run progress — which case is running, where its answer went, and (when judging is
enabled and the case has `[expected]` criteria) the per-criterion PASS/FAIL evaluation.

## Files

- **`cli.ts`** — entry point (`npm run mcp:harness`). Parses `--mcp <url>` and the case
  paths, discovers cases, allocates the per-run trace folder, and drives the flow: one
  query per case, then the judge when `JUDGE` is set. Owns the console output and exit code.
- **`Harness.ts`** — a generic `Harness` class: an OpenAI-compatible conversation engine. It
  owns the client, drives the (optionally tool-calling) agentic loop and monitors token
  usage. It carries no prompts or test knowledge — the provider, tools, tracer and prompts
  are all supplied by the caller. Both the query and the judge are built on it.
- **`query.ts`** — the "test the question against the MCP" step. Builds a `Harness` on the
  model under test (`TEST_OPENAI_CONFIG`) wired to the MCP tools, feeds it the discovery
  prompt plus the case question/files, and returns the answer with the token tally. Writes
  the per-request/response traces.
- **`judge.ts`** — the grader. Builds a `Harness` on `JUDGE_OPENAI_CONFIG` with no tools and
  asks it to score the answer against the case's `[expected]` criteria.
- **`provider.ts`** — loads and validates an OpenAI config from an env var.
- **`mcpClient.ts`** — connects to the MCP server and exposes its tools.
- **`testCase.ts`** — parses a `.toml` case and builds the user message.

## Test-case format

Test cases live under `test/mcp/cases/`. TOML, see `cases/demo.toml` and
`cases/migration/simple.toml`:

```toml
[user]
question = """How do I demo ui5-test-runner ?"""

[files]              # optional — injected into the prompt as fenced code blocks
package.json = """..."""

[expected]           # named criteria — the judge grades the answer against each
repository = "the response should reference ..."
```
