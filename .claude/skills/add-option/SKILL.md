---
name: add-option
description: Use this skill when the user asks to add a new option or parameter to ui5-test-runner, mentions adding a CLI flag, or when about to edit src/configuration/options.ts directly without going through the documented workflow. Options must be defined via a doc file first, then regenerated with `make options` — never by editing options.ts manually.
argument-hint: "[option-name]"
allowed-tools:
  - Read
  - "Write(docs/options/**)"
  - "Bash(make options)"
---

# Add Option

Options in ui5-test-runner are **never added by editing `src/configuration/options.ts` directly**. The source of truth is a documentation file in `docs/options/`. The TypeScript source is generated from it.

## Workflow

1. **Create the doc file** — `docs/options/<name>.md` with the correct frontmatter
2. **Confirm** before running the generator
3. **Run `make options`** — regenerates `src/configuration/options.ts`

## Step 0 — Verify the type exists

Before gathering any other information, confirm the option's type is one of the built-in types defined in `src/configuration/Option.ts`:

| Type | Use for |
|---|---|
| `boolean` | on/off flags |
| `string` | arbitrary text values |
| `integer` | whole numbers |
| `percent` | 0–100 numeric values |
| `timeout` | durations (ms/s/m suffixes supported) |
| `url` | valid URLs |
| `regexp` | regular expressions |
| `fs-entry` | file or folder paths (combine with `typeModifiers`) |
| `browser` | browser selection (specialised, rarely used) |

**If the desired type is not in this list** (e.g. an enum with fixed allowed values):

1. Tell the user that the type does not exist yet.
2. Explain that adding a new type requires:
   - Creating `docs/options/types/<type>.md` documenting the accepted values
   - Extending the `OptionType` union in `src/configuration/Option.ts`
   - Adding a corresponding validator under `src/configuration/validators/`
   - These steps are **out of scope for this skill**
3. Suggest using `string` as a stopgap and documenting the accepted values in the option's description body, e.g.:
   ```
   Accepted values: `foo`, `bar`, `baz`.
   ```
4. Ask the user whether to proceed with `string` or to stop and implement the new type first.

Do not continue to Step 1 until the type question is resolved.

## Step 1 — Gather information

Ask the user for the following, one block at a time if not already provided via `$ARGUMENTS`:

| Field | Required | Notes |
|---|---|---|
| `name` | yes | camelCase, e.g. `failFast` |
| `type` | yes | one of the built-in types listed in Step 0 |
| `summary` | yes | short sentence, lowercase, no trailing period |
| `short` | no | single-letter CLI shorthand |
| `default` | no | JavaScript expression, e.g. `"'report'"`, `"2"`, `"!process.stdout.isTTY"` |
| `multiple` | no | `yes` if the option can be repeated |
| `typeModifiers` | no | for `fs-entry` only: `file`, `safe-default`, `overwrite` (one or more) |
| `dependsOn` | no | wikilink to another option this one is relative to, e.g. `"[[cwd]]"` |
| `tags` | no | subset of: `legacy`, `remote`, `capabilities`, `batch` |
| `see` | no | wikilinks to related options |
| description body | no | one or more sentences explaining behaviour; leave empty if the summary is self-explanatory |

## Step 2 — Create `docs/options/<name>.md`

Use this frontmatter template (omit optional fields that have no value):

```markdown
---
"#type": "[[option]]"
short: <short>
type: "[[<type>]]"
summary: <summary>
default: "<default>"
multiple: yes
typeModifiers:
  - "[[<modifier>]]"
dependsOn: "[[<other>]]"
tags:
  - <tag>
see:
  - "[[<related>]]"
---
<description body>
```

**Type wikilink format:**
- Simple types: `"[[boolean]]"`, `"[[string]]"`, `"[[integer]]"`, `"[[percent]]"`, `"[[timeout]]"`, `"[[url]]"`, `"[[regexp]]"`, `"[[browser]]"`
- fs-entry: `"[[fs-entry]]"`

**Modifier wikilink format:**
- `"[[file]]"`, `"[[safe-default]]"`, `"[[overwrite]]"`

Show the draft file content to the user and ask for confirmation before writing.

## Step 3 — Write the file and run the generator

Once confirmed:

1. Write `docs/options/<name>.md`
2. Ask: *"Ready to run `make options` to regenerate `src/configuration/options.ts`?"*
3. If confirmed: run `make options`
4. Remind the user to review the diff in `src/configuration/options.ts` before committing

## Examples

### Boolean option (no default)
```markdown
---
"#type": "[[option]]"
short: f
type: "[[boolean]]"
summary: stop the whole execution after the first failing page
tags:
  - legacy
  - remote
  - batch
---
```

### Integer option with default
```markdown
---
"#type": "[[option]]"
short: p
type: "[[integer]]"
summary: number of parallel executions
default: "2"
tags:
  - legacy
  - remote
  - batch
---
This option controls how many parallel executions can occur inside the runner.
```

### fs-entry with modifiers
```markdown
---
"#type": "[[option]]"
type: "[[fs-entry]]"
typeModifiers:
  - "[[overwrite]]"
summary: directory to output test reports
default: "'report'"
dependsOn: "[[cwd]]"
tags:
  - legacy
  - remote
---
```

### URL option with multiple
```markdown
---
"#type": "[[option]]"
short: u
type: "[[options/types/url|url]]"
multiple: yes
summary: URL of the page to test
tags:
  - "#remote"
---
```
