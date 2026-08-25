# ADR-0011: MCP Knowledge Base — GitHub-Hosted, On-Demand Fetch

## Status
Accepted

## Context

The `--mcp` mode exposes a knowledge base of `ui5-test-runner` documentation to MCP clients (AI assistants). The knowledge base must be:

1. **Always up to date** — documentation evolves with every release; a stale KB gives wrong answers
2. **Available without credentials** — the MCP server may run in any environment; requiring a GitHub token is a deployment burden
3. **Readable as plain text** — MCP tools return markdown; HTML transformation (e.g. GitHub Pages) breaks machine consumption
4. **Discoverable** — the MCP server must be able to list topics without hardcoding paths

Three approaches were evaluated:

| Approach | Up to date | No credentials | Plain text | Discoverable |
|---|---|---|---|---|
| Embed `mcp-kb/` in npm package (build step) | ❌ only at publish time | ✅ | ✅ | ✅ |
| GitHub Pages | ❌ HTML transformed | ✅ | ❌ | ❌ |
| GitHub raw + Contents API | ✅ always `main` | ✅ public repo | ✅ | ✅ |

## Decision

The knowledge base is served from the public GitHub repository using a combination of two GitHub APIs — no credentials required:

### File content — `raw.githubusercontent.com`

Every file in the repo is accessible as raw bytes:

```
https://raw.githubusercontent.com/ArnaudBuchholz/ui5-test-runner/main/docs/<path>
```

Returns the file content as-is (UTF-8 markdown). No rate limiting. Used for individual file fetches.

### Directory listing and update detection — GitHub Contents API

```
GET https://api.github.com/repos/ArnaudBuchholz/ui5-test-runner/contents/docs
```

Returns a JSON array of `{ name, path, sha, size, download_url }` entries. `download_url` is the corresponding `raw.githubusercontent.com` URL. Unauthenticated requests are rate-limited to 60/hour — sufficient for on-demand fetches.

### Update detection — git tree SHA

```
GET https://api.github.com/repos/ArnaudBuchholz/ui5-test-runner/git/trees/main?recursive=1
```

Returns the full file tree of `main` in a single request. The top-level `sha` is the commit tree SHA. Comparing it to the locally cached SHA tells whether anything in the repo has changed:

- **Same SHA** → local cache is current; no download needed
- **Different SHA** → diff per-file `sha` values to identify changed blobs; fetch only those via `raw.githubusercontent.com`; store the new tree SHA

This makes update detection cheap: one API call (~1 KB response) on MCP server start, selective re-download of only changed files rather than the full `docs/` tree.

### Caching strategy

- Fetched file content is cached for the lifetime of the MCP server process
- The tree SHA, per-file SHAs, and the **timestamp of the last SHA fetch** are persisted locally to survive restarts
- On start: if the last SHA fetch is **older than 1 hour**, call `api.github.com` to get the current tree SHA; otherwise use the cached SHA
- If the SHA differs, diff per-file SHAs, fetch only changed files, update stored SHA and timestamp

## Consequences

### Positive
- ✅ **Always current**: KB reflects `main` at all times, not just at publish time
- ✅ **No build step**: no `build:mcp-kb` script, no committed generated files
- ✅ **Selective updates**: tree SHA diffing avoids re-downloading unchanged files
- ✅ **No credentials**: works in any environment against the public repo

### Negative/Trade-offs
- ❌ **Network dependency**: MCP server requires internet access on first use and after updates; local-only environments need the fallback cache
- ❌ **Rate limiting**: GitHub REST API is limited to 60 unauthenticated calls/hour; mitigated by the 1-hour check interval (at most one `api.github.com` call per hour regardless of restart frequency)
- ❌ **GitHub availability**: an outage degrades to the last cached state

### Mitigation
- The 1-hour check interval bounds `api.github.com` usage to at most 1 call/hour, well within the 60/hour unauthenticated limit even under frequent restarts
- Keep the local cache as a fallback when the network is unavailable
- Per-file fetches are only triggered on a SHA mismatch

## Related Files & Modules

- **`src/modes/mcp/REserve.ts`** — MCP HTTP handler; currently reads from `mcp-kb/`; target of the migration
- **`build/mcpKnowledgeBase.mjs`** — current build script generating `mcp-kb/` from `docs/` frontmatter
- **`src/platform/Http.ts`** — `Http.getAsText` for remote fetching
- **`package.json`** — `mcp-kb/` in `files` array; `build:mcp-kb` script; both to be removed post-migration
