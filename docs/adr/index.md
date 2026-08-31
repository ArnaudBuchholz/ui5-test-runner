# Architecture Decision Records

This directory documents significant architectural decisions made in the `ui5-test-runner` project.

## Overview

| ADR | Title | Status | Summary |
|-----|-------|--------|---------|
| [0001](./0001-platform-abstraction-layer.md) | Platform Abstraction Layer | Accepted | Abstract Node.js APIs behind a testable platform interface to improve maintainability, testability, and cross-platform support |
| [0002](./0002-parallel-browser-agents.md) | Parallel Browser Agents Architecture | Accepted | Execute tests in parallel across multiple isolated browser instances using an in-browser agent pattern to overcome memory and performance constraints |
| [0003](./0003-configuration-validation-strategy.md) | Configuration Validation Strategy | Accepted | Implement multi-stage configuration validation (schema, defaults, transformations) with clear separation between parsing, validation, and merging |
| [0004](./0004-report-generation-architecture.md) | Report Generation Architecture | Accepted | Decouple report generation from test execution using a pipeline approach, supporting multiple output formats and interactive UIs |
| [0005](./0005-logging-and-tracing-architecture.md) | Logging and Tracing Architecture | Accepted | Worker-based structured logging with a compressed binary trace format, separating live terminal output from a complete queryable record written to disk |
| [0006](./0006-batch-mode-orchestration.md) | Batch Mode Orchestration | Accepted | Orchestrate multi-project test runs by spawning one isolated child process per batch item, using IPC as a thin signal channel for progress and skip events |
| [0007](./0007-start-end-command-lifecycle.md) | Start/End Command Lifecycle | Accepted | Support pre-test and post-test hook commands with NPM script resolution, parameter substitution, `forceRender` output bypass, and unconditional end-command exit-code authority |
| [0008](./0008-ui-controller-pattern.md) | UI Controller Pattern | Accepted | Implement browser-side UIs using a typed `AbstractUserInterfaceController` base class that enforces a diff-only, optimistic-update MVC protocol without a frontend framework |
| [0009](./0009-coverage-architecture.md) | Coverage Architecture | Accepted | Instrument UI5 source files via nyc subprocess, intercept dynamic module loading in-browser, collect per-page coverage data, then merge and report with optional threshold-as-CTRF-failure integration |
| [0010](./0010-graceful-shutdown.md) | Graceful Shutdown | Accepted | LIFO async task registry with SIGINT handler, `ExitShutdownError` for post-shutdown safety, and handle leak detection |
| [0011](./0011-mcp.md) | MCP Mode | Accepted | GitHub-hosted KB fetched on demand with git tree SHA for cheap update detection; async execution tools (`run`/`getStatus`/`cancel`) with IPC-based snapshots; ephemeral artifacts in `os.tmpdir()` |
| [0012](./0012-screenshot-capture-and-attachment.md) | Screenshot Capture and Attachment | Accepted | Agent owns screenshot filenames (built from pageId+testId+logIndex), signals the runner via `pendingScreenshot: string | false`, and attaches per-assertion screenshots to `CTRFTest.attachments[]` in `testDone` |

## Quick Navigation

- **When modifying `src/platform/`** → See [ADR-0001](./0001-platform-abstraction-layer.md)
- **When modifying `src/agent/` or `src/browsers/`** → See [ADR-0002](./0002-parallel-browser-agents.md)
- **When modifying `src/configuration/`** → See [ADR-0003](./0003-configuration-validation-strategy.md)
- **When modifying `src/reports/` or `src/ui/`** → See [ADR-0004](./0004-report-generation-architecture.md)
- **When modifying `src/platform/logger/` or `src/modes/log/`** → See [ADR-0005](./0005-logging-and-tracing-architecture.md)
- **When modifying `src/modes/batch/` or `src/if.ts`** → See [ADR-0006](./0006-batch-mode-orchestration.md)
- **When modifying `src/Command.ts`, `src/start.ts`, or `src/end.ts`** → See [ADR-0007](./0007-start-end-command-lifecycle.md)
- **When modifying `src/utils/ui/` or any `*Controller.ts`** → See [ADR-0008](./0008-ui-controller-pattern.md)
- **When modifying `src/modes/test/coverage/`, `src/agent/ui5Coverage.ts`, or `src/Npm.ts`** → See [ADR-0009](./0009-coverage-architecture.md)
- **When modifying `src/platform/Exit.ts` or shutdown/SIGINT handling** → See [ADR-0010](./0010-graceful-shutdown.md)
- **When modifying `src/modes/mcp/`, the knowledge base fetch strategy, or MCP execution tools** → See [ADR-0011](./0011-mcp.md)
- **When modifying `src/modes/test/screenshot.ts`, screenshot naming, or per-assertion screenshot attachment** → See [ADR-0012](./0012-screenshot-capture-and-attachment.md)

## Cross-Cutting Concerns

All ADRs assume:
- The project is written in TypeScript with comprehensive test coverage (`.spec.ts` and `.test.ts` files)
- Modular architecture with clear separation of concerns
- Testability is a first-class concern
