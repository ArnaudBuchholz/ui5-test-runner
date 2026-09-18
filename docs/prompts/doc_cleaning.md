# Refactor: replace Obsidian `[[wiki-links]]` in `docs/` with renderer-portable relative links + stateless MCP context resolution

## Context

The `docs/` folder is being promoted to the root of a **knowledge base** that an MCP builder will sit on top of (ui5-test-runner MCP). The docs were authored in Obsidian, so cross-references use the non-standard `[[double bracket]]` syntax. Three problems motivate this refactor:

1. `[[...]]` is non-standard and confuses LLMs consuming the docs.
2. Obsidian resolves bare `[[name]]` targets by *global indexing*; the MCP server has no global index, so links must be self-describing.
3. Making links relative-to-file alone doesn't work: the MCP server serves one file at a time and, being **stateless (hard requirement)**, does not know which document a relative link came from — so the context is lost.

**Chosen outcome:** Markdown on disk uses **plain relative links** (`[failFast](../failFast.md)`) that navigate correctly in *any* markdown renderer (VS Code, GitHub). The MCP `get_topic` handler, when serving a document, **rewrites each relative link at runtime** to append a query string carrying a **hash of the served document's folder** (`../failFast.md?<hash>`). When the LLM later requests that link, the handler decodes the hash back to the folder, resolves the relative path against it, and reads the target — fully stateless, context travels inside the link.

Decisions locked with the user:
- **Frontmatter:** revert `[[...]]` in frontmatter to plain scalar values (NOT links). Frontmatter is metadata, not part of the KB body. **Exception:** the `see:` list should become links — but the user will handle `see:` themselves later, so **leave `see:` out of scope**.
- **Dangling targets in PROSE ONLY** (`option`, `percent`, `json`, and any bracketed word with no backing `.md` file) → convert to **plain text** (strip brackets, no link). NOTE: the browser/enum names `chrome`, `chromium`, `firefox`, `webkit`, `edge`, `safari` also have no backing file, but they appear in **`typeModifiers` frontmatter**, so they are handled by frontmatter revert (A1), NOT by the prose rule. Do not double-process. Confirm before treating any bracketed word as "dangling prose" that it is actually in the body, not frontmatter.
- **Server must be stateless** — non-negotiable.
- **Link format** = plain relative path in the file; MCP injects a **folder hash** at runtime.

## Design summary

```
On disk:   [failFast](../failFast.md)          <- portable, clickable in any renderer
Served:    [failFast](../failFast.md?a3f9c1)    <- MCP appends hash of CURRENT doc's folder
Lookup:    get_topic("../failFast.md?a3f9c1")   <- MCP decodes a3f9c1 -> "options/types",
                                                    resolves "../failFast.md" -> "options/failFast.md"
```

- **Hash = of the folder of the doc being served** (relative paths resolve against the containing directory, so folder granularity is correct — not per-file).
- **Reverse map (hash -> folder) is built in memory** by walking KB folders once; no committed artifact. Stateless per request.

## Part A — Rewrite the markdown in `docs/`

Scope: 232 `[[...]]` instances across 81 files. Split by location (confirmed via exploration):

### A1. Frontmatter `[[...]]` → plain scalar values (revert)
Keys affected: `#type` (73×, always `[[option]]`), `type` (73×), `typeModifiers` (20×), `dependsOn` (10×). **Skip `see:` (31×) — user owns it.**

Transform each frontmatter wiki-link to its inner name, dropping any `path|` alias prefix and any path segments:
- `"#type": "[[option]]"` → `"#type": option`
- `type: "[[timeout]]"` → `type: timeout`
- `type: "[[options/types/enumeration|enumeration]]"` → `type: enumeration`
- `type: "[[options/types/url|url]]"` → `type: url`
- `- "[[safe-default]]"` → `- safe-default`
- `- "[[options/types/modifiers/file|file]]"` → `- file`
- `dependsOn: "[[cwd]]"` → `dependsOn: cwd`

Representative files: `docs/options/browser.md`, `docs/options/url.md`, `docs/options/coverageSourceDir.md`, `docs/options/config.md`, `docs/options/end.md`, and every `docs/options/*.md` with `#type`.

**Constraint — must keep `make options` output byte-identical.** `build/options.mjs` currently extracts the inner name via regex `/\[\[(?:[^\\\]]+\|)?([^\]]*)\]\]/` on `metadata.type` (line 55) and `typeModifiers` (line 72), and gates on `metadata['#type'] !== '[[option]]'` (line 45). After the frontmatter is plain, those three spots must be updated to read plain strings (see Part C). **Verification: regenerate and `git diff` the generated files — must be empty.**

### A2. Prose-body `[[...]]` → plain relative markdown links (or plain text for dangling)
~13 real prose occurrences (exact list from exploration):
- `docs/options/coverageSourceDir.md:14` `[[webapp]]` → `[webapp](./webapp.md)`
- `docs/options/webapp.md:14` `[[ui5]]` → `[ui5](./ui5.md)`, `[[lib]]` → `[lib](./lib.md)`
- `docs/options/localhost.md:11` `[[legacy]]` → `[legacy](../modes/legacy.md)`
- `docs/options/ci.md:14` `[[reportDir]]` → `[reportDir](./reportDir.md)`
- `docs/options/end.md:21` `[[start]]` → `[start](./start.md)`
- `docs/options/types/fs-entry.md:2-4` `[[modifiers/file]]` etc. → `[file](./modifiers/file.md)`, `[overwrite](./modifiers/overwrite.md)`, `[safe-default](./modifiers/safe-default.md)`
- `docs/options/types/modifiers/overwrite.md:5` & `docs/options/types/modifiers/file.md:5` `[[fs-entry]]` → `[fs-entry](../fs-entry.md)`
- `docs/options/types/boolean.md:6` `[[failFast]]` → `[failFast](../../failFast.md)` (boolean is in `options/types/`, failFast in `options/`)
- `docs/adr/0003-configuration-validation-strategy.md:30` — `[[option]]` inside a table cell describing the schema → plain text `option` (dangling; it's documentation *about* the value, not a nav link)

Link text = the bare name (preserve alias text where one existed). Target = **relative path from the current file** to the destination `.md`, computed per-occurrence. Ambiguous basenames (`browser`, `url`, `batch`, `coverage`) are disambiguated naturally because we now write an explicit relative path.

Dangling prose targets → strip to plain text.

### A3. `docs/prompts/driver_browser.md` (11 `[[...]]`)
This is a prompt/spec doc; its `[[...]]` are mostly inside fenced ```yaml examples illustrating the *old* option-file format. **Update its examples to reflect the new plain-frontmatter convention** so the prompt doesn't teach the obsolete syntax. Confirm nothing here is load-bearing for generation (it isn't — `build/options.mjs` only reads `docs/options/**`).

## Part B — MCP server: runtime link rewriting + stateless resolution

Files: `src/modes/mcp/tools/getTopic.ts`, `src/modes/mcp/knowledgeBase.ts`, plus a new small helper module.

### B1. Folder-hash helper (new module, e.g. `src/modes/mcp/folderHash.ts`)
- `hashFolder(folderRelPath: string): string` — **sha256 of the folder path, truncated to the first 6 hex chars**. Uses a new **`src/platform/Crypto.ts`** wrapper (per ADR-0001 — no direct `node:crypto` import outside `platform/`), exported from `src/platform/index.ts` and mockable via the global platform mock.
  - **Normalize the folder path before hashing** so the same folder always yields the same hash: KB-root-relative, POSIX separators, no leading `./`, no trailing `/`. The KB root itself is the empty string `''`.
  - `Crypto.ts` wrapper shape (mirrors existing platform wrappers like `src/platform/Path.ts`): `import { createHash } from 'node:crypto'; export class Crypto { static sha256hex(input: string): string { return createHash('sha256').update(input).digest('hex'); } }`. `hashFolder` calls `Crypto.sha256hex(normalized).slice(0, 6)`.
- **Reverse index `hash -> folderRelPath`.** Build it by enumerating every folder under the KB root. **NOTE: `knowledgeBase.readdir` is one level deep only** (`FileSystem.readdir`, non-recursive) — you must recurse yourself. Add a helper that, starting from `''`, lists entries and recurses into subdirectories. `src/platform/FileSystem.ts` exposes **`FileSystem.stat`** — use `(await FileSystem.stat(join(root, entry))).isDirectory()` to distinguish folders from files. Collect every folder path (including `''` for the root). Then map each `folder -> hashFolder(folder)` and invert. Memoize the whole index build (see `src/utils/shared/memoize.ts`) so the walk happens once per process.
  - **Collision handling:** while building, if two distinct folders hash to the same 6 hex chars, throw at build time (loud failure) rather than silently colliding. With the current ~10 folders this cannot happen, but the guard documents intent.

### B2. On read (`get_topic` serving a doc)
The handler already knows the served doc's KB-relative path (the `relativePath` that succeeded in the candidate loop). Compute `folder = Path.dirname(relativePath)` (dirname of `options/webapp.md` is `options`; dirname of a root file like `index.md` is `.` → normalize to `''`), then `hash = hashFolder(folder)`.

Rewrite links in the body with this regex (Markdown inline links):
```js
body.replace(/\]\(([^)]+)\)/g, (match, target) => { /* … */ })
```
For each captured `target`, **only append the hash when the target is a relative link to a doc** — i.e. ALL of:
- does not start with a scheme (`http://`, `https://`, `mailto:` — test `/^[a-z][a-z0-9+.-]*:/i`),
- does not start with `/` (root-absolute),
- does not start with `#` (pure anchor),
- is not already carrying a query (`?`) — defensive, on-disk files won't have one.

Preserve any trailing `#anchor`: split `target` into `path` + `#frag`, append `?<hash>` to `path`, re-attach `#frag` → `path?<hash>#frag`. Leave everything else (images `![]()`, absolute URLs, anchors) untouched.

### B3. On lookup (`get_topic` receiving a link)
Parse the incoming `topic` string in this order:
1. Strip a legacy wrapper `^\[\[(.+)]]$` → inner (existing behaviour, `getTopic.ts:17`; keep for back-compat).
2. Strip any `#anchor` (everything from the first `#`) — anchors are for the renderer, not file resolution.
3. If a `?` is present: split into `relPath` + `hash`. Look up `hash` in the reverse index → `folder`. Resolve: `resolved = Path.join(folder, relPath)` then normalize away `./` and `../` (Node `path.join` already collapses them, but the result must stay KB-root-relative and must NOT escape the root — reject/`not found` if it starts with `..`). Candidates = `[`${resolved}`]` if it already ends in `.md`, else `[`${resolved}.md`, `${resolved}/index.md`]`.
4. If NO `?` (bare topic, as emitted by `list_topics`/`index.md`, or a hand-typed name): keep current behaviour — candidates `topic.includes('/') ? ['${topic}.md'] : ['${topic}.md', '${topic}/index.md']`.
5. If the hash is not found in the reverse index → return the existing `Topic "…" not found.` message.

Keep the existing candidate-path loop (try each, first that reads wins) — B3 only changes how the candidate list is *built*.

### B4. `index.md` / `list_topics`
`listTopics.ts` reads `index.md` from the KB root, but **no `docs/index.md` exists** — so `list_topics` is currently broken in local-docs mode. `docs/README.md` exists and is the human-facing landing page, but it is kept as-is.

**Decision:** create a **new, separate `docs/index.md`** as the KB entry point for the MCP `list_topics` tool (distinct from `README.md`). `listTopics.ts` keeps reading `index.md` (no code change). Author it as a topic list using the same **plain relative link** convention as the rest of the KB, so its links get the same runtime folder-hash rewriting (Part B2). Keep it lean (a navigable table of contents of KB topics).

## Part C — Generator (`build/options.mjs`) compatibility

Update to read the now-plain frontmatter. **Exact edits** (the surrounding `parseYaml`/`errors` logic stays):

**Line 45 — gate.** Replace:
```js
if (metadata['#type'] !== '[[option]]') {
```
with:
```js
if (metadata['#type'] !== 'option') {
```

**Lines 54–55 — type extraction.** The old code was `const [, type] = (metadata.type ?? '').match(/\[\[(?:[^\\\]]+\|)?([^\]]*)\]\]/) ?? [];`. Replace it (and delete the `// eslint-disable-next-line sonarjs/super-linear-regex` comment on line 54) with a direct read:
```js
const type = metadata.type === undefined ? undefined : String(metadata.type);
```
The validation `if (!type || !types.includes(type))` on line 56 is unchanged and still works.

**Lines 67–76 — typeModifiers.** The old `.map(entry => entry.match(/…/))` becomes a direct string map (also delete its `eslint-disable` comment on line 71):
```js
let typeModifiers;
if (Array.isArray(metadata.typeModifiers)) {
  typeModifiers = metadata.typeModifiers.map((entry) => String(entry)).filter(Boolean);
}
```

- Leave `see`/`dependsOn`/`validation` handling untouched (already unused; `// TODO: leverage dependsOn` stays).
- **Do NOT touch lines 100+** (the code-generation half that emits `options.ts`, `Configuration.ts`, `validations.ts`, `docs/options.md`). It consumes the in-memory `options` object, which is now populated identically to before — that is the whole point.

**Ordering constraint for the person doing this:** apply Part C **together with** Part A1 in the same pass, then run verification step 1 *before* touching anything else. If A1 is done without C, `make options` errors ("Unknown type"); if C is done without A1, it also errors. They are a matched pair.

## Part D — Tests

- `src/modes/mcp/reserve.spec.ts`: update assertions that expect `[[...]]` to be preserved in returned bodies (lines 81–82, 98) — they must reflect the new link form / rewriting. The `strips [[ ]] brackets` test (line 101) stays as legacy back-compat coverage.
- Add unit tests for the new `folderHash` helper (hash stability, reverse lookup) and for `get_topic` link rewriting + hash-based resolution, following repo test conventions (see memory: test conventions, platform mock is a global setup — do NOT re-mock it).
- Regenerate options and assert clean `git diff` on generated files.

## Files to modify (representative)

- `docs/options/**/*.md` (frontmatter revert + prose links) — ~73 option files + `docs/options/types/**`
- `docs/options/types/fs-entry.md`, `docs/options/types/boolean.md`, `docs/options/types/modifiers/{file,overwrite}.md`
- `docs/options/{coverageSourceDir,webapp,localhost,ci,end}.md` (prose)
- `docs/adr/0003-configuration-validation-strategy.md` (one prose `[[option]]` → plain text)
- `docs/prompts/driver_browser.md` (example blocks)
- `build/options.mjs` (lines 45, 55, 72)
- `src/modes/mcp/tools/getTopic.ts`
- `src/modes/mcp/tools/listTopics.ts` (no change — keeps reading `index.md`; listed for context)
- `src/modes/mcp/knowledgeBase.ts` (recursive folder walk if needed)
- `src/modes/mcp/folderHash.ts` (new) + spec
- `docs/index.md` (new — KB entry point / topic list, separate from `README.md`)
- `src/modes/mcp/reserve.spec.ts` (assertion updates)
- `src/platform/Crypto.ts` (new) + `src/platform/index.ts` export, per ADR-0001

## Verification

1. `npm run build:options` → `git diff src/configuration/options.ts src/agent/Configuration.ts src/configuration/validations.ts docs/options.md` must be **empty** (frontmatter change is transparent to generation).
2. `grep -rn '\[\[' docs --include='*.md'` → only expected residue (none, or documented exceptions).
3. Run MCP in local-docs mode (`debugMcpLocalDocs`) and exercise `get_topic`:
   - Request `options/webapp.md` → body's relative links come back with `?<hash>` appended.
   - Follow one of those hashed links via `get_topic` → correct target document returned.
   - Confirm two calls in any order both resolve (statelessness).
4. `npm test` (targeted: `src/modes/mcp/**`) green, including new folderHash + rewrite tests.
5. Manual: open a converted doc in VS Code / GitHub preview → relative links click through correctly.

## Resolved decisions (previously open)
- **Crypto:** add `src/platform/Crypto.ts` wrapper (ADR-0001), not inline `node:crypto`.
- **Index:** create a separate new `docs/index.md` as the KB entry point; `README.md` unchanged; `listTopics.ts` keeps reading `index.md`.
- **Hash:** sha256 of the folder path, first **6** hex chars.

## Worked examples / self-check (use these to validate the MCP logic)

Assume `hashFolder('options')` = `aaa111`, `hashFolder('options/types')` = `bbb222`, `hashFolder('')` (root) = `ccc333`. (Actual hashes differ — these are placeholders to check the *plumbing*.)

Read-time rewriting (B2):
| Served doc | Link on disk | Rewritten link served to LLM |
|---|---|---|
| `options/coverageSourceDir.md` | `[webapp](./webapp.md)` | `[webapp](./webapp.md?aaa111)` |
| `options/types/boolean.md` | `[failFast](../../failFast.md)` | `[failFast](../../failFast.md?bbb222)` |
| `options/localhost.md` | `[legacy](../modes/legacy.md)` | `[legacy](../modes/legacy.md?aaa111)` |
| any | `[docs home](https://x/y)` | unchanged (scheme) |
| any | `[jump](#section)` | unchanged (anchor) |
| any | `![img](./a.png)` | unchanged (image, and not `.md`) |
| `index.md` (root) | `[usage](./usage.md)` | `[usage](./usage.md?ccc333)` |

Lookup resolution (B3) — given the incoming `topic`, the resolved KB path:
| Incoming `topic` | Steps | Resolved KB path |
|---|---|---|
| `./webapp.md?aaa111` | hash aaa111 → `options`; join → `options/webapp.md` | `options/webapp.md` |
| `../../failFast.md?bbb222` | hash bbb222 → `options/types`; join `options/types` + `../../failFast.md` → `options/failFast.md` | `options/failFast.md` |
| `../modes/legacy.md?aaa111` | hash aaa111 → `options`; join → `modes/legacy.md` | `modes/legacy.md` |
| `./a.md?bbb222#frag` | strip `#frag`; hash bbb222 → `options/types`; join → `options/types/a.md` | `options/types/a.md` |
| `options` (bare, no `?`) | legacy path: `options.md`, else `options/index.md` | unchanged legacy behaviour |
| `[[installation]]` | strip `[[ ]]` → `installation`; bare, no `?` | legacy behaviour |
| `../../../etc/passwd?aaa111` | join escapes root (starts with `..`) → reject | `Topic "…" not found.` |
| `./x.md?zzz999` (unknown hash) | hash not in index → | `Topic "…" not found.` |

If your implementation produces every row above, the MCP half is correct.
