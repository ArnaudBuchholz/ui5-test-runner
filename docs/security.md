---
"#type": concept
title: Security
summary: The security posture of ui5-test-runner — how the v6 agent paradigm removed the need to relax browser security, and the supply-chain risk of runtime dependency installation
keywords:
  - security
  - secure
  - unsecure
  - agent
  - paradigm
  - supply chain
  - dependencies
  - hardening
relations:
  see-also:
    - dependency_management
    - browsers/v6/browser
    - v6_breaking_changes
---
# Security

This page summarizes the security posture of `ui5-test-runner`. There are two
areas worth understanding: how the runner talks to the browser, and how it
obtains its dependencies.

## The agent paradigm removed the need to relax browser security

In version 5, the test page had to **post its feedback back to the runner**. To
let the page reach the runner, browser security sometimes had to be relaxed —
hence the old `--unsecure` flag, which disabled browser security features (for
example Chrome's local-network-access check).

Version 6 changed this paradigm. Instead of the page calling back, an **agent is
injected into the test page** and the runner **fetches its state**. Because the
page no longer initiates a connection to the runner, no browser security
relaxation is required: the `--unsecure` flag is gone and is no longer needed.
See the [v6 driver model](./browsers/v6/browser.md) and the
[version 6 breaking changes](./v6_breaking_changes.md) for the details of this
shift.

This makes the default configuration safer than the v5 equivalent — you are no
longer disabling browser protections to run your tests.

## Dependencies are the main risk surface

The remaining security consideration is how the runner obtains the browser
drivers, browser binaries, and coverage tooling it needs. By default it can
**auto-install missing packages at runtime**, which bypasses your lockfile and
can pull a freshly published (potentially compromised) version.

The safer, reproducible setup is to pre-install your own pinned dependencies and
disable runtime installation. The mitigations — `--npm-install-min-release-age`,
the default `--ignore-scripts`, and `--no-npm-install` — are described in
[dependency management](./dependency_management.md); that page is the canonical
reference for this topic.
