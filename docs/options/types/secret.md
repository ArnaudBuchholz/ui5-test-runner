---
"#type": concept
title: secret type
summary: Option value holding a sensitive string, redacted in all serialized output.
keywords:
  - secret
  - password
  - sensitive
  - redact
relations:
  see-also:
    - options/browserBasicAuthPassword
---
# secret type

A sensitive string value (e.g. a password) that is never exposed in logs, reports, or `--dump-config` output.

## Syntax

Any non-empty string is accepted. The value is stored internally as an opaque object; all serialization paths (traces, CTRF report, `--dump-config`) replace it with `***`.

## Example

The [`browserBasicAuthPassword`](../browserBasicAuthPassword.md) option takes a secret string:

```bash
ui5-test-runner --browser-basic-auth-password mypassword
```
