---
"#type": "[[option]]"
type: "[[fs-entry]]"
summary: alternate NPM package path
batchForwarded: yes
dependsOn: "[[cwd]]"
---
When searching for packages, the runner checks paths in the following order:

1. local
2. global
3. alternate (this option, if specified)
4. `npmInstallPrefix` (if specified)