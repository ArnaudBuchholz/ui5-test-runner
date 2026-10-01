# MCP validation harness

Connects an LLM to the ui5-test-runner MCP server and lets it answer a question using the
server's tools (`list_topics`, `get_topic`, `run`), then scores the answer against the
test case's `[expected]` criteria with a second LLM (the judge).

- **Step 1** — the harness produces an answer.
- **Step 2** — if the case defines `[expected]` criteria, the judge grades the answer
  (one PASS/FAIL + rationale per criterion). The harness exits non-zero if any fail.

## Configure

Install the harness dependency once:

```
npm install
```

Set the LLM configuration as JSON env vars (in a root `.env` or the shell):

```
TEST_OPENAI_CONFIG={"apiKey":"...","baseUrl":"https://api.groq.com/openai/v1","model":"llama-3.3-70b-versatile"}
JUDGE_OPENAI_CONFIG={"apiKey":"...","baseUrl":"https://api.groq.com/openai/v1","model":"llama-3.3-70b-versatile"}
```

`TEST_OPENAI_CONFIG` is the model under test; `JUDGE_OPENAI_CONFIG` is the grader — they
can point at different models/providers. Any OpenAI-compatible endpoint works (Groq,
OpenRouter, a local gateway…). The harness exits with an error if a required config is
missing or not valid JSON. `JUDGE_OPENAI_CONFIG` is only read when the case has
`[expected]` criteria.

## Run

1. Start the MCP server in one terminal (default port 3000):

   ```
   npm run cli -- --mcp
   ```

2. Run the harness against a test case in another terminal:

   ```
   npm run mcp:harness -- --mcp http://localhost:3000/mcp test/mcp/cases/demo.toml
   ```

The harness prints the tool calls, the final assistant answer, a token summary, and — when
the case has `[expected]` criteria — the per-criterion PASS/FAIL evaluation. Per-request/
response JSON traces are written to `test/mcp/tmp/<timestamp>/`.

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
