---
name: doc-review
description: Review KB documentation entities (docs/ files with frontmatter) for ADR-0011 compliance and factual accuracy against the source code. Use when asked to audit docs, review a doc file, or check whether documentation is accurate.
argument-hint: "[path-to-doc-or-docs-dir]"
allowed-tools:
  - Read
  - Bash(find docs -name "*.md")
  - "Bash(grep * -r)"
  - "Bash(cat *)"
  - "Bash(node build/kbIndex.mjs)"
  - "Bash(npm run build:kb-index)"
---

# doc-review

Review one or more KB documentation entities for two independent concerns:

1. **ADR-0011 compliance** — the frontmatter and structure follow the rules in `docs/adr/0011-mcp.md`
2. **Factual grounding** — every factual claim in the body is consistent with the actual source code

These are separate passes. Run both on every entity reviewed, report findings grouped by concern.

## Scope

If `$ARGUMENTS` names a specific file or path, review only that. Otherwise review every `.md` file under `docs/` (excluding `docs/adr/`, `docs/prompts/`, `docs/decks/`) that has a `#type` frontmatter key — those are the KB entities. Skip files without `#type`; they are not entities.

## Pass 1 — ADR-0011 compliance

For each entity check every rule below. Cite the specific rule and the exact field/line when reporting a finding.

### 1.1 Mandatory KB fields

Every entity must have all five:

| Field | Rule |
|---|---|
| `#type` | One of exactly: `option`, `mode`, `concept`, `task` |
| `title` | Non-empty string |
| `summary` | Non-empty string, single sentence, ends without a trailing period; must be meaningful to an LLM doing catalog matching (not "see below" or similar) |
| `keywords` | Non-empty list; must include terms a user would naturally search for |
| `id` | Optional — when present, must be a short stable handle; when absent the id derives as path-relative-to-docs minus `.md` minus trailing `/index` |

### 1.2 Entity type correctness

Apply the four distinguishing rules **in order**:

1. Has a CLI flag, `type:`, `default:`, read by `build/options.mjs`? → must be `option`
2. One of the fixed execution modes (legacy, remote, batch, mcp, …)? → must be `mode`
3. Primarily explains *what something is / how it works*, readable in any order? → `concept`
4. Primarily tells *how to achieve a goal*, often as steps? → `task`

Flag any entity where the `#type` conflicts with these rules.

### 1.3 Relations

- Every id in `see-also`, `affects`, `requires`, `supersedes` must resolve to a real entity id. Run `node build/kbIndex.mjs` to validate — a non-zero exit or error output means dangling edges exist.
- `breaking-in` values are version tokens (e.g. `v6`), not entity ids — do not validate them as ids.
- `supersedes` implies the superseded entity still exists as a historical record; if it is absent, flag it.
- Prefer typed edges over `see-also` where a stronger relation is accurate: use `requires` when the linked entity must be understood first, `affects` when this entity changes the behaviour of another, `supersedes` when this replaces a removed entity.

### 1.4 Body rules

- Body must not restate content that belongs in another entity — cross-references by `[[id]]` body link or `relations` edge, never by copy-pasting.
- Body length must not exceed 300 lines (the build enforces this; flag anything approaching the limit).
- Body links are human-facing relative markdown links (e.g. `[text](./other.md)`). They are not validated by the build. Flag any body link whose target file does not exist on disk.
- ADRs (`docs/adr/`) are not KB entities and must not be referenced via `relations` edges (body links to them are fine for humans).

### 1.5 Filename convention

Files under `docs/` (excluding `docs/options/`) must use **snake_case** for multi-word names. Files under `docs/options/` use **lowerCamelCase**. ADRs use `NNNN-kebab.md`. Flag any file that deviates.

### 1.6 Summary quality (retrieval impact)

The summary is the primary field the LLM matches on in `list_topics`. Check:
- Is it self-contained? Could a reader identify the entity from the summary alone?
- Does it avoid filler phrases ("This document…", "See below…")?
- For `option` entities: does it describe what the option *does*, not just its name?
- For `task` entities: does it read as a goal ("How to…" / "Migrate…")?

### 1.7 Anti-duplication

Flag any entity whose body restates a fact that is the canonical content of another entity. The rule: a page that needs concept A writes `see [[concept-a]]`; it never pastes A's explanation.

---

## Pass 2 — Factual grounding

For each factual claim in the entity body, verify it against the source code. This pass matters most for `option` and `mode` entities, which describe runtime behaviour.

### 2.1 What to verify

| Claim type | Where to check |
|---|---|
| Option exists, its type, default value | `src/configuration/options.ts` (generated) — match `name`, `type`, `defaultValue` |
| Option short flag | `src/configuration/options.ts` — match `short` |
| Option accepted values / enumeration | `src/configuration/validators/` and `docs/options/types/` |
| Mode name / how a mode is selected | `src/modes/Modes.ts`, `src/modes/execute.ts` |
| Runner behaviour description | `src/modes/test/`, `src/modes/batch/`, `src/modes/mcp/`, etc. |
| Default values cited in prose | Cross-check against `src/configuration/options.ts` `defaultValue` |
| Version-specific claims (v5/v6) | `docs/v5_options.md`, `docs/v6_breaking_changes.md`, git history if needed |

### 2.2 How to check

1. Read the entity body and extract each factual claim as a bullet.
2. For each claim, identify the most direct source file to verify it against.
3. Read the relevant section of that source file.
4. Record: **CONFIRMED** (claim matches source), **OUTDATED** (claim was true but source changed), **UNVERIFIABLE** (no source to check against — document this honestly), or **INCORRECT** (claim contradicts source).

Do not mark a claim INCORRECT without reading the source first.

### 2.3 Options — specific checks

For every `#type: option` entity:

- `type:` in frontmatter matches the `OptionType` for that option in `src/configuration/options.ts`
- `default:` in frontmatter (if present) matches `defaultValue` in `src/configuration/options.ts`
- `short:` in frontmatter (if present) matches `short` in `src/configuration/options.ts`
- `batchForwarded: yes` is only set when the option appears in the `batchForwarded` list in the source
- `browserExposed: yes` is only set when the option appears in `src/agent/Configuration.ts`
- The body description matches what the option actually does in the runner

### 2.4 Modes — specific checks

For every `#type: mode` entity:

- The mode is listed in `src/modes/Modes.ts` (or equivalent) under the documented name
- Activation conditions (which CLI flags trigger it) match `src/modes/execute.ts` or `src/modes/Modes.ts`
- Any described behaviour (e.g. "spawns one child process per batch item") is visible in `src/modes/<mode>/`

---

## Reporting

After both passes, produce a structured report:

```
## <entity id>  (<path>)

### ADR-0011 compliance
- ✅ / ⚠️ / ❌  <finding or "no issues">

### Factual grounding
- ✅ CONFIRMED / ⚠️ UNVERIFIABLE / ❌ OUTDATED|INCORRECT — "<claim>" — <evidence>
```

Use ✅ for no issues or confirmed, ⚠️ for warnings (unverifiable, weak summary, approaching limits), ❌ for definite problems (missing field, incorrect fact, dangling edge, wrong type).

At the end, print a one-line summary:

```
X entities reviewed — Y issues (Z errors, W warnings)
```

If `$ARGUMENTS` names a single file, focus the report on that file only and be more detailed — include the full list of confirmed facts, not just problems.

## Notes

- Run `node build/kbIndex.mjs` once at the start to catch dangling edges across the whole graph; individual file reviews still need this to confirm their outgoing edges resolve.
- When verifying facts in source, prefer `grep` over loading entire files; read only the sections relevant to the claim.
- Do not propose fixes in this skill — report findings only. Fixing is a separate step the user will request.
- `docs/options/` entities are partially machine-generated from their own frontmatter by `build/options.mjs`; when frontmatter fields diverge from `src/configuration/options.ts`, the source of truth is the **doc file** (the generator reads from it), so flag the mismatch but note its direction.
