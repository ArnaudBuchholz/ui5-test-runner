---
"#type": "[[option]]"
type: "[[string]]"
summary: batch item specification (folder, config file, or regex pattern)
multiple: yes
tags:
  - batch
---
Each value selects one or more test projects to run as independent child processes. Accepted formats: a folder path, a JSON configuration file path, or a regular expression matching folder or config file paths.

Specifying at least one `--batch` value activates batch mode.
