---
"#type": concept
title: fs-entry type
summary: Option value pointing to a file-system entry (a file or a folder), refinable with the file, overwrite and safe-default modifiers
keywords:
  - fs-entry
  - file
  - folder
  - path
  - filesystem
---
# fs-entry type

Can be either a `file` or a `folder`.

## Syntax

A file-system path. It can be refined with modifiers:

* [file](./modifiers/file.md)
* [overwrite](./modifiers/overwrite.md)
* [safe-default](./modifiers/safe-default.md)

`fs-entry` values are resolved relative to [`cwd`](../cwd.md) by convention (each option's doc notes when a different base applies).

## Placeholders

An `fs-entry` value may start with a placeholder that is expanded, at configuration time, to a directory resolved by the runner. The text after the placeholder is appended to that directory:

* `{{reportDir}}` — the resolved [`--report-dir`](../reportDir.md), e.g. `{{reportDir}}/coverage`
* `{{tmpDir}}` — the operating-system temporary directory, e.g. `{{tmpDir}}/ui5tr-npm-install`

## Example

The [`log`](../log.md) option points to a file:

```bash
ui5-test-runner --log ./traces.logz
```
