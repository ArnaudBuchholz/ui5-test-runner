# ADR-0002: Parallel Browser Agents Architecture

## Status
Accepted

## Context

Traditional test runners execute all tests in a single browser instance sequentially or with limited concurrency. This causes problems:

1. **Memory Exhaustion**: Long test suites accumulate memory leaks and DOM nodes, eventually crashing
2. **Slow Execution**: Sequential execution in one browser is inherently limited by single-threaded JS
3. **Isolation Issues**: Tests share global state (localStorage, cookies, timers), leading to flaky tests
4. **Scalability**: Difficult to use multiple CPU cores effectively

The ui5-test-runner needed to handle large UI5 test suites efficiently without exhausting memory on typical CI/CD machines.

## Decision

Adopt a **Parallel Browser Agents Architecture**:

```
┌─────────────────────────────────────┐
│  CLI Orchestrator (Node.js)         │
│  - Parses config                    │
│  - Spawns browser instances         │
│  - Aggregates results               │
└──────────────┬──────────────────────┘
│
┌─────────┴──────────┬────────────┐
│                    │            │
┌──▼──────┐  ┌─────────▼──┐  ┌──────▼─────┐
│ Browser │  │  Browser   │  │  Browser   │
│ Instance│  │ Instance   │  │ Instance   │
├─────────┤  ├────────────┤  ├────────────┤
│ Agent   │  │ Agent      │  │ Agent      │
│ (JS)    │  │ (JS)       │  │ (JS)       │
│ - Runs  │  │ - Runs     │  │ - Runs     │
│ tests   │  │ tests      │  │ tests      │
│ - Posts │  │ - Posts    │  │ - Posts    │
│ results │  │ results    │  │ results    │
└─────────┘  └────────────┘  └────────────┘
```

### Key Components

**Browser Abstraction Layer (`src/browsers/`)**
- Unified interface supporting Puppeteer and Playwright
- Handles browser lifecycle (launch, connect, close)
- Exposes methods for navigation, resource loading, code execution
- Abstracts browser-specific differences

**In-Browser Agent (`src/agent/`)**
- Injected JavaScript that runs **inside** each browser instance
- Responsibilities:
  - Discover and execute test suites (QUnit, other frameworks)
  - Collect test results (pass/fail, errors, coverage)
  - Report results back to CLI via IPC/WebSocket
  - Handle browser console logging and errors
- Designed to be **stateless** and repeatable (each test run is fresh)

**Orchestrator (`src/cli.ts` + related files)**
- Manages configuration and parallelization strategy
- Spawns multiple browser instances
- Distributes test files across agents
- Waits for all browsers to complete
- Aggregates results into unified report

## Consequences

### Positive
✅ **Memory Isolation**: Each browser instance has its own memory space; crashes are contained
✅ **True Parallelism**: Multiple browsers run tests simultaneously, speeding up total execution time
✅ **Flexibility**: Easy to adjust parallelization (1, 2, 4, N browsers) based on hardware
✅ **Reliability**: Test isolation reduces flaky tests due to shared state
✅ **Scalability**: Handles large test suites without degradation

### Negative/Trade-offs
❌ **Complexity**: More moving parts (agent injection, IPC, result aggregation)
❌ **Resource Usage**: N browsers use N times the memory (though isolated instances may be smaller total)
❌ **Synchronization**: Coordinating results across browsers adds complexity
❌ **Debugging**: Harder to debug tests running inside browser agents

### Mitigation
- Keep agent code simple and focused
- Use comprehensive logging from agents
- Provide debugging mode where single browser is used
- Document agent contract clearly

## Related Files & Modules
- **Browser Abstraction**: `src/browsers/`
  - Puppeteer implementation: `src/browsers/puppeteer.ts`
  - Playwright implementation: `src/browsers/playwright.ts`
- **Agent Code**: `src/agent/`
  - Test discovery and execution
  - Result collection
  - Communication with CLI
- **Orchestration**: `src/cli.ts`, `src/start.ts`, `src/end.ts`
- **Configuration**: `src/configuration/` (parallelization options)

## Agent Execution Lifecycle

1. **Spawn**: CLI creates N browser instances
2. **Inject**: Agent code is loaded into each browser
3. **Discover**: Agent finds available test suites
4. **Execute**: Agent runs assigned tests
5. **Report**: Agent sends results back to CLI
6. **Cleanup**: Browser instance closes

## Configuration Options

Key configuration parameters:
- `parallel`: Number of browser instances (default: CPU count)
- `browsers`: Which browser(s) to use (Puppeteer, Playwright, etc.)
- `timeout`: Per-test timeout
- `failFast`: Stop on first failure
