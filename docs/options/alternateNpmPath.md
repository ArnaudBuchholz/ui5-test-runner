---
"#type": option
title: alternateNpmPath
type: fs-entry
summary: additional path the runner searches for npm packages after the local and global locations
keywords:
  - npm
batchForwarded: yes
dependsOn: cwd
---
When searching for packages, the runner checks paths in the following order:

1. local
2. global
3. alternate *(this option, if specified)*
4. [`npmInstallPrefix`](./npmInstallPrefix.md) *(if specified)*