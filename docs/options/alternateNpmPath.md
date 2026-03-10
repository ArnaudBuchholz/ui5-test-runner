---
"#type": "[[option]]"
type: "[[fs-entry]]"
typeModifiers:
  - "[[options/types/modifiers/folder|folder]]"
  - "[[options/types/modifiers/exists|exists]]"
summary: alternate NPM package path
dependsOn: "[[cwd]]"
---
When searching for packages, the runner will first fetch from the NPM command the local and global path.

Priority is :
1. local
2. alternate (if specified)
3. global