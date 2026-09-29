---
"#type": concept
title: fs-entry type
summary: Option value pointing to a file-system entry (a file or a folder), refinable with the file, overwrite and safe-default modifiers.
keywords:
  - fs-entry
  - file
  - folder
  - path
  - filesystem
---
Can be either a `file` or a `folder`.

## Syntax

A file-system path. It can be refined with modifiers:

* [file](./modifiers/file.md)
* [overwrite](./modifiers/overwrite.md)
* [safe-default](./modifiers/safe-default.md)

Most `fs-entry` options are relative to [`cwd`](../cwd.md) unless specified otherwise.

## Example

The [`log`](../log.md) option points to a file: `--log ./traces.logz`.
