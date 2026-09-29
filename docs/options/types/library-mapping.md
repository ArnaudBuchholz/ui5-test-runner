---
"#type": concept
title: library-mapping type
summary: Option value describing how a UI5 resources sub-folder is mapped to a local source folder.
keywords:
  - library-mapping
  - library
  - mapping
  - ui5
  - resources
---
Maps a UI5 resources sub-folder to a local source folder so that resources can be served from the file system instead of being fetched remotely.

## Syntax

A mapping is expressed as a `resourcesSubFolder=sourceFolder` string:

* `resourcesSubFolder`: the sub-folder under the UI5 resources path to override.
* `sourceFolder`: the local folder the resources are served from. It is validated as an [`fs-entry`](./fs-entry.md), so it must point to an existing folder.

When the `=sourceFolder` part is omitted, the source folder defaults to `resourcesSubFolder` (the sub-folder is mapped to itself).

A value with more than one `=` is rejected.

Instead of the string form, the value can also be provided as an object with `resourcesSubFolder` and `sourceFolder` properties (for instance from a configuration file).

## Example

* `my/lib=./src/my/lib` — serve `my/lib` resources from the local `./src/my/lib` folder.
* `my/lib` — shorthand for `my/lib=my/lib`.

The [`lib`](../lib.md) option uses this type and accepts multiple mappings, so it can be repeated: `--lib my/lib=./src/my/lib --lib other/lib=./src/other`.
