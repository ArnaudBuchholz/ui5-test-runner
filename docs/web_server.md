---
"#type": concept
title: Web server and UI5 proxy
summary: How the inner web server serves the application, proxies UI5 resources, and applies library mappings
keywords:
  - server
  - proxy
  - resources
  - test-resources
  - reserve
  - ui5
  - library mapping
relations:
  see-also:
    - options/webapp
    - options/ui5
    - options/lib
    - options/port
    - modes/legacy
  affects:
    - modes/legacy
    - modes/remote
---
# Web server and UI5 proxy

In [legacy mode](./modes/legacy.md), `ui5-test-runner` starts an inner web server
([REserve](https://www.npmjs.com/package/reserve)) that delivers the application
under test and resolves its UI5 dependencies. This page describes how requests
are routed.

## Serving the application

The server exposes the folder configured by [`--webapp`](./options/webapp.md)
(default `webapp`) at the root. Any request that does not match a more specific
rule is served as a static file from that folder.

If no [`--port`](./options/port.md) is given, the server listens on an ephemeral
port chosen by the operating system. The actual port is substituted into the
tested URL in place of the `:0/` placeholder.

## Proxying UI5 resources

Requests under `resources/` and `test-resources/` are the UI5 framework files.
They are resolved in the following order:

1. **Library mappings** declared with [`--lib`](./options/lib.md). A mapping
   `resourcesSubFolder` is served from its local `sourceFolder`, so a project can
   substitute its own copy of a UI5 library.
2. **Local `resources/` / `test-resources/`** inside the `webapp` folder, when
   present.
3. **The UI5 CDN** configured by [`--ui5`](./options/ui5.md) (default
   `https://ui5.sap.com`). The server reverse-proxies the request to that URL.
   Unverifiable TLS certificates are accepted on this mapping so a corporate or
   self-signed UI5 host can be used.

Only `GET` and `HEAD` requests are served for local resource folders; the UI5
proxy mapping also answers `GET` and `HEAD`.

## Interaction with coverage

When [coverage](./coverage.md) is enabled, requested `.js` files are served from
the instrumented copy under the coverage temporary directory instead of their
original location. Library mappings whose source lives inside the project are
likewise served instrumented, falling back to the original file when no
instrumented version exists.

## Remote mode

In [remote mode](./modes/remote.md) the application is already served elsewhere
(reached through [`--url`](./options/url.md)), so the inner server does not serve
the application itself. Coverage instrumentation and library mapping concepts
still apply to how results are collected.
