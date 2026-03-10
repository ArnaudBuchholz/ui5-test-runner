---
"#type": "[[option]]"
type: "[[fs-entry]]"
typeModifiers:
  - "[[options/types/modifiers/file|file]]"
  - "[[options/types/modifiers/exists|exists]]"
  - "[[safe-default]]"
summary: path of the testsuite file
default: "'webapp/test/testsuite.qunit.html'"
dependsOn: "[[cwd]]"
tags:
  - legacy
  - remote
---
BREAKING CHANGE : no more relative to [[webapp]], does **not** support URL parameters.
