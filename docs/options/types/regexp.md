---
"#type": concept
title: regexp type
summary: Option value that is a regular expression used to match a value.
keywords:
  - regexp
  - regex
  - regular expression
  - match
  - filter
---
A [regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions) used to match a value.

## Syntax

The value can be provided in two forms:

* a bare pattern, for instance `unit` — used directly as the regular expression source.
* a `/pattern/flags` literal, for instance `/unit/i` — the pattern and its [flags](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags) (such as `i`, `g`, `m`) are extracted and applied.

The value must not be empty, and the pattern must be a valid regular expression; an invalid one is rejected.

## Example

The [`pageFilter`](../pageFilter.md) option uses this type to select which pages run: `--page-filter /unit/i` keeps only the pages whose name matches `unit`, case-insensitively.
