# Architecture Decision Records

This directory documents significant architectural decisions made in the `ui5-test-runner` project.

## Overview

| ADR | Title | Status | Summary |
|-----|-------|--------|---------|
| [0001](./0001-platform-abstraction-layer.md) | Platform Abstraction Layer | Accepted | Abstract Node.js APIs behind a testable platform interface to improve maintainability, testability, and cross-platform support |
| [0002](./0002-parallel-browser-agents.md) | Parallel Browser Agents Architecture | Accepted | Execute tests in parallel across multiple isolated browser instances using an in-browser agent pattern to overcome memory and performance constraints |
| [0003](./0003-configuration-validation-strategy.md) | Configuration Validation Strategy | Accepted | Implement multi-stage configuration validation (schema, defaults, transformations) with clear separation between parsing, validation, and merging |
| [0004](./0004-report-generation-architecture.md) | Report Generation Architecture | Accepted | Decouple report generation from test execution using a pipeline approach, supporting multiple output formats and interactive UIs |

## Quick Navigation

- **When modifying `src/platform/`** → See [ADR-0001](./0001-platform-abstraction-layer.md)
- **When modifying `src/agent/` or `src/browsers/`** → See [ADR-0002](./0002-parallel-browser-agents.md)
- **When modifying `src/configuration/`** → See [ADR-0003](./0003-configuration-validation-strategy.md)
- **When modifying `src/reports/` or `src/ui/`** → See [ADR-0004](./0004-report-generation-architecture.md)

## Cross-Cutting Concerns

All ADRs assume:
- The project is written in TypeScript with comprehensive test coverage (`.spec.ts` and `.test.ts` files)
- Modular architecture with clear separation of concerns
- Testability is a first-class concern
