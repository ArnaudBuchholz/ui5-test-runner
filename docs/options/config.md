---
"#type": "[[option]]"
type: "[[fs-entry]]"
typeModifiers:
  - "[[options/types/modifiers/file|file]]"
  - "[[safe-default]]"
summary: read options from a configuration file
default: "'ui5-test-runner.json'"
dependsOn: "[[cwd]]"
tags:
  - legacy
  - remote
---
The configuration file is a JSON object whose property names match option names in lowerCamelCase. It is applied **before** command-line parameters, so CLI values override the file.

To **force** a value that cannot be overridden by the command line, prefix the property name with `!`:

```json
{
  "!pageTimeout": 900000,
  "globalTimeout": 3600000,
  "failFast": true
}
```

Options that accept multiple values (e.g. `--libs`) can be a single string or an array:

```json
{
  "libs": [
    "my/namespace/lib/=../my.namespace.lib/src/my/namespace/lib/",
    "my/namespace/lib2/=../my.namespace.lib2/src/my/namespace/lib2/"
  ]
}
```
