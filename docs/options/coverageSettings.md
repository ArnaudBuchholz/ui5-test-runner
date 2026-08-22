---
"#type": "[[option]]"
type: "[[fs-entry]]"
short: cs
typeModifiers:
  - "[[file]]"
  - "[[safe-default]]"
summary: path to the Istanbul configuration file (.nycrc.json)
default: "'.nycrc.json'"
dependsOn: "[[cwd]]"
tags:
  - coverage
  - legacy
  - remote
---
Points to a standard `.nycrc.json` file used to configure Istanbul (include/exclude patterns, etc.). If the file does not exist the default is silently ignored and Istanbul runs with built-in defaults augmented by the runner.
