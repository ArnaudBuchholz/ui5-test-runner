---
"#type": concept
title: overwrite modifier
summary: Modifier allowing an fs-entry option to point to a possibly missing item that will be overwritten if it exists.
keywords:
  - overwrite
  - modifier
  - fs-entry
relations:
  affects:
    - options/types/fs-entry
---
By default, an [fs-entry](../fs-entry.md) option points to an existing item.

This modifier indicates that:
- The item entry *may* not exist,
- If it exists, the item will be **overwritten**.
