---
"#type": option
title: lib
type: library-mapping
multiple: yes
summary: Library mapping
keywords:
  - library
  - mapping
relations:
  affects:
    - modes/legacy
---
Declares a [library-mapping](./types/library-mapping.md), serving a UI5 resources sub-folder from a local source folder instead of fetching it remotely.

The value is a `resourcesSubFolder=sourceFolder` string (or just `sourceFolder`, which maps the sub-folder to itself) — see the [library-mapping](./types/library-mapping.md) type for the full syntax.

Can be repeated to declare several mappings.

When the [`webapp`](./webapp.md) folder contains a `resources` (or `test-resources`) sub-folder, its content is mapped automatically, so no explicit mapping is needed for it.