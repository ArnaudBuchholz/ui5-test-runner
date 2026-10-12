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

1. **Create the doc file** — `docs/options/<name>.md` with the correct frontmatter (filename must use lowerCamelCase, e.g. `logFilter.md`)
2. **Confirm** before running the generator
3. **Run `make options`** — regenerates `src/configuration/options.ts` **and** `src/agent/Configuration.ts`

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
| `title` | yes | human-facing label; default to the option name verbatim, e.g. `failFast` |
| `type` | yes | one of the built-in types listed in Step 0 |
| `summary` | yes | short sentence, lowercase, no trailing period |
| `short` | no | single-letter CLI shorthand |
| `default` | no | JavaScript expression, e.g. `"'report'"`, `"2"`, `"!process.stdout.isTTY"` |
| `multiple` | no | `yes` if the option can be repeated |
| `typeModifiers` | no | for `fs-entry` only: `file`, `safe-default`, `overwrite` (one or more) |
| `dependsOn` | no | plain option name this one is relative to, e.g. `cwd` |
| `browserExposed` | no | `yes` if the option value must be passed to the agent (browser context) — also adds it to `src/agent/Configuration.ts` |
| `keywords` | no | subset of: `legacy`, `remote`, `capabilities`, `batch`, `agent` (retrieval terms; formerly `tags`) |
| `relations.see-also` | no | related options as path-qualified ids, e.g. `options/cwd` |
| description body | no | one or more sentences explaining behaviour; leave empty if the summary is self-explanatory |

## Step 2 — Create `docs/options/<name>.md`

Frontmatter uses **plain scalar values — not `[[wikilinks]]`**. Use this template (omit optional fields that have no value):

```markdown
---
"#type": option
title: <name>
short: <short>
type: <type>
summary: <summary>
default: "<default>"
multiple: yes
typeModifiers:
  - <modifier>
dependsOn: <other>
keywords:
  - <keyword>
relations:
  see-also:
    - options/<related>
---
```

**Important**: The filename must use lowerCamelCase (e.g. `logFilter.md`, `pageFilter.md`, `agentDetectionInterval.md`). The `id` is derived from the path (`options/<name>`) — do not add an explicit `id:`.

### Body format

Every option doc must have a body following this pattern:

```markdown
# `--kebab-case-name` / `-x`

<summary sentence>

## Overview

| | |
|---|---|
| Type | [`<type>`](types/<type>.md) |
| Values | `val1` \| `val2` \| `val3` |
| Multiple | yes |
| Default | `<value>` or *none* |
| Config key | `<camelCaseName>` |
| Short flag | `-x` |
| Propagates to batch items | yes |

## <Meaningful section(s) if needed>

## Example

```bash
ui5-test-runner --kebab-case-name value
```
```

**Overview table rules:**
- `Type` — always present; link to `types/<type>.md`
- `Values` — only for `enumeration` type; list all accepted values separated by ` \| `
- `Multiple` — only when `multiple: yes` in frontmatter
- `Default` — always present; use *none* when absent
- `Config key` — always present; the camelCase option name as used in `ui5-test-runner.json`
- `Short flag` — only when `short:` is set in frontmatter
- `Propagates to batch items` — only when `batchForwarded: yes` in frontmatter (do **not** add a Browser-exposed row — that is internal)

**Example section rules:**
- Show 1–2 concrete, realistic CLI invocations
- For `multiple` options, list values space-separated after a single flag: `--flag val1 val2` (do **not** repeat the flag)
- For `timeout` options, show both ms and suffix forms: `--page-timeout 60000` and `--page-timeout 1m`
- For `boolean` options, show the flag alone: `--fail-fast`
- For `enumeration` options, show the most common value

Show the draft file content to the user and ask for confirmation before writing.

## Step 3 — Write the file and run the generator

Once confirmed:

1. Write `docs/options/<name>.md`
2. Ask: *"Ready to run `make options` to regenerate `src/configuration/options.ts` and `src/agent/Configuration.ts`?"*
3. If confirmed: run `make options`
4. Remind the user to review the diff in `src/configuration/options.ts` and `src/agent/Configuration.ts` before committing

## Examples

### Boolean option (no default)
```markdown
---
"#type": option
title: failFast
short: f
type: boolean
summary: stop the whole execution after the first failing page
keywords:
  - legacy
  - remote
  - batch
---
# `--fail-fast` / `-f`

Stop the whole execution after the first failing page.

## Overview

| | |
|---|---|
| Type | [`boolean`](types/boolean.md) |
| Default | *none* |
| Config key | `failFast` |
| Short flag | `-f` |
| Propagates to batch items | yes |

## Example

```bash
ui5-test-runner --fail-fast
```
```

### Integer option with default
```markdown
---
"#type": option
title: parallel
short: p
type: integer
summary: number of parallel executions
default: "2"
keywords:
  - legacy
  - remote
  - batch
---
# `--parallel` / `-p`

Number of parallel executions.

## Overview

| | |
|---|---|
| Type | [`integer`](types/integer.md) (positive, non-zero) |
| Default | `2` |
| Config key | `parallel` |
| Short flag | `-p` |
| Propagates to batch items | yes |

## Example

```bash
ui5-test-runner --parallel 4
```
```

### fs-entry with modifiers
```markdown
---
"#type": option
title: reportDir
short: r
type: fs-entry
typeModifiers:
  - overwrite
summary: directory to output test reports
default: "'report'"
dependsOn: cwd
keywords:
  - legacy
  - remote
---
# `--report-dir` / `-r`

Directory to output test reports.

## Overview

| | |
|---|---|
| Type | [`fs-entry`](types/fs-entry.md) (overwrite) |
| Default | `'report'` |
| Config key | `reportDir` |
| Short flag | `-r` |

## Example

```bash
ui5-test-runner --report-dir ./test-results
```
```

### URL option with multiple
```markdown
---
"#type": option
title: url
short: u
type: url
multiple: yes
summary: URL of the page to test
keywords:
  - remote
---
# `--url` / `-u`

URL of the page to test.

## Overview

| | |
|---|---|
| Type | [`url`](types/url.md) |
| Multiple | yes |
| Default | *none* |
| Config key | `url` |
| Short flag | `-u` |

## Example

```bash
ui5-test-runner --url http://localhost:8080/test/page.qunit.html
ui5-test-runner -u http://host/test/a.qunit.html http://host/test/b.qunit.html
```
```

### Enumeration option
```markdown
---
"#type": option
title: driver
short: d
type: enumeration
typeModifiers:
  - puppeteer
  - playwright
  - webdriverio
  - selenium-webdriver
summary: browser automation driver
default: "'puppeteer'"
batchForwarded: yes
keywords:
  - legacy
  - remote
---
# `--driver` / `-d`

Browser automation driver.

## Overview

| | |
|---|---|
| Type | [`enumeration`](types/enumeration.md) |
| Values | `puppeteer` \| `playwright` \| `webdriverio` \| `selenium-webdriver` |
| Default | `'puppeteer'` |
| Config key | `driver` |
| Short flag | `-d` |
| Propagates to batch items | yes |

## Example

```bash
ui5-test-runner --driver playwright
```
```
