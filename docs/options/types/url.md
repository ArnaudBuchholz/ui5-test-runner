---
"#type": concept
title: url type
summary: Option value that must be a valid URL
keywords:
  - url
  - link
  - address
---
# url type

Any valid URL.

## Syntax

A URL string, including its scheme (for instance `http://` or `https://`). An invalid URL is rejected.

## Example

The [`startWaitUrl`](../startWaitUrl.md) option takes a URL to poll:

```bash
ui5-test-runner --start-wait-url http://localhost:8080/health
```
