---
"#type": "[[option]]"
type: "[[string]]"
summary: batch item specification (folder, config file, or regex pattern)
multiple: yes
tags:
  - batch
---
Each value selects one or more test projects to run as independent child processes. Accepted formats:

- **Folder path**: runs `--cwd <folder>`
- **JSON config file path**: runs `--config <file>`
- **Regular expression**: recursively scans `--cwd` and collects matching folders and config files. The pattern is tested against the path **relative to `--cwd`** (separators normalized to `/`) and can be implicitly anchored at the start (`^`), so `^test/e2e/[\w_]*\.json` matches only entries whose path begins with `test/e2e/`.

Specifying at least one `--batch` value activates batch mode.
