# ADR-0002: Parallel Browser Agents Architecture

## Status
Accepted

## Context

Traditional test runners execute all tests in a single browser instance sequentially or with limited concurrency. This causes problems:

1. **Memory Exhaustion**: Long test suites accumulate memory leaks and DOM nodes, eventually crashing
2. **Slow Execution**: Sequential execution in one browser is inherently limited by single-threaded JS
3. **Isolation Issues**: Tests share global state (localStorage, cookies, timers), leading to flaky tests
4. **Scalability**: Difficult to use multiple CPU cores effectively

The `ui5-test-runner` needed to handle large UI5 test suites efficiently without exhausting memory on typical CI/CD machines.

## Decision

Adopt a **Parallel Browser Agents Architecture**:

```
┌────────────────────────────────────────────────────────────────────┐
│  ui5-test-runner                                                   │
│                                                                    │
│   ┌──────────────────────────┐          ,────────────────────,     │
│   │                          │ ──────► (       report         )    │
│   │           core           │          '────────────────────'     │
│   │                          │          ,────────────────────,     │
│   │                          │ ──────► (        logs          )    │
│   └──────────────────────────┘          '────────────────────'     │
│                │                                                   │
│            ◄IBrowser►                                              │
│                │                                                   │
│                ▼                                                   │
│   ┌──────────────────────────┐                                     │
│   │    browser automation    │                                     │
│   └──────────────────────────┘                                     │
└────────────────│───────────────────────────────────────────────────┘
                 │
             ◄IWindow►
                 │
┌────────────────│───────────────────────────────────────────────────┐
│  Browser       │                                                   │
│    ┌───────────▼────────────────────┐                              │
│   ┌────────────────────────────────┐│      ,────────────,          │
│   │  Window                        │◄─────(    cache     )         │
│   │   ┌─────────┐   ┌─────────┐    ││      '────────────'          │ 
│   │   │  agent  │   │  Tests  │    ││                              │
│   │   └─────────┘   └─────────┘    ││                              │
│   │        │                       ││                              │
│   │        ▼                       ││                              │
│   │   ,───────────────,            ││                              │
│   │  (   agent state   )           ││                              │
│   │   '───────────────'            |┘                              │
│   └────────────────────────────────┘                               │
└────────────────────────────────────────────────────────────────────┘
```

### Key Components

**Browser Abstraction Layer (`src/browsers/`)**
- Unified interface supporting Puppeteer, Playwright, WebDriverIO, and Selenium WebDriver
- `IBrowser` handles the browser lifecycle: `setup(settings)` (launch + report capabilities), `newWindow(settings)` (open a page with its agent scripts and target URL), and `shutdown()`
- `IWindow` exposes per-page operations: `eval(script)` (code evaluation), `screenshot(path)`, and `close()`. Agent script injection is not a method — scripts are passed via `WindowSettings.scripts` at `newWindow`, and navigation happens via `WindowSettings.url`
- Abstracts browser-specific differences via `IBrowser` / `IWindow` interfaces

**In-Browser Agent (`src/agent/`)**
- JavaScript injected into each page before navigation (via `evaluateOnNewDocument` / `addInitScript`)
- Responsibilities:
  - Detect test framework after page load (QUnit, or suite pages)
  - Collect test results (pass/fail, errors, uncaught errors)
  - Expose state and results on `window['ui5-test-runner']` for the CLI to poll
  - Handle browser console logging and uncaught errors
- Maintains per-page mutable state; each page/window gets a fresh agent instance

**Orchestrator (`src/modes/test/index.ts` + related files)**
- Manages configuration and parallelization strategy
- Launches a **single** browser instance and opens multiple pages concurrently
- Distributes URLs (test pages) across parallel page tasks via `parallelize()`
- Polls each page by evaluating `window['ui5-test-runner'].state` at a configurable interval
- Aggregates results into unified report

### Navigation Readiness

Navigation resolves at **DOMContentLoaded** readiness, **not** the full `load` event:

- Puppeteer and Playwright navigate with `goto(url, { waitUntil: 'domcontentloaded' })`; the two
  BiDi-based drivers (WebDriverIO, and Selenium's non-first windows) navigate with the equivalent
  `interactive` readiness state.
- **Why**: a UI5 application keeps fetching framework resources one-by-one *after* the DOM is
  parsed. Waiting for the full `load` event blocks the navigation call on that entire resource
  waterfall and trips the automation library's hardcoded navigation timeout (~30 s in Puppeteer) —
  a ceiling the user cannot raise. DOMContentLoaded lets navigation return as soon as the document
  is parsed, and the slow framework load is then absorbed by the agent's framework-detection polling.
- **Invariant**: how long a page may take to become ready is governed by `pageTimeout` and the
  agent's detection polling — **not** by the navigation call. `goto` is still awaited, so a broken
  URL or dead server still fails fast via a navigation rejection.
- **Why this is safe**: the agent is injected *before* navigation (`evaluateOnNewDocument` /
  `addInitScript`) and assigns `window['ui5-test-runner'] = { state, results }` synchronously at
  document creation, with `state` starting as `{ done: false, type: undefined }`. So the moment a
  document is committed at DOMContentLoaded, polling `window['ui5-test-runner'].state` already
  returns a valid object — there is no window where the agent or its `state` is absent. Framework
  detection (QUnit / suite) then begins on the `load` event and mutates that same `state`.

## Consequences

### Positive
- ✅ **Page Isolation**: Each page (window) has its own DOM, localStorage, and JS context; one page crashing does not affect others
- ✅ **True Parallelism**: Multiple pages run tests simultaneously, speeding up total execution time
- ✅ **Flexibility**: Easy to adjust parallelization (1, 2, 4, N pages) based on hardware via the `parallel` option
- ✅ **Reliability**: Test isolation reduces flaky tests due to shared state
- ✅ **Scalability**: Handles large test suites without degradation

### Negative/Trade-offs
- ❌ **Complexity**: More moving parts (agent injection, polling loop, result aggregation)
- ❌ **Resource Usage**: N concurrent pages use more memory; a single browser process still accumulates over a very long run
- ❌ **Synchronization**: Coordinating results across pages adds complexity
- ❌ **Debugging**: Harder to debug tests running inside browser agents

### Mitigation
- Keep agent code simple and focused
- Use comprehensive logging from agents
- Provide `--debug-keep-browser-open` mode to inspect pages after tests complete
- Document agent contract clearly

## Related Files & Modules
- **Browser Abstraction**: `src/browsers/`
  - Interfaces: `src/browsers/IBrowser.ts` (`IBrowser`, `IWindow`, `BrowserSettings`, `WindowSettings`, `BrowserCapabilities`, `BrowserDriverDescriptor`)
  - Puppeteer implementation: `src/browsers/puppeteer.ts`
  - Playwright implementation: `src/browsers/playwright.ts`
  - WebDriverIO implementation: `src/browsers/webdriverio.ts`
  - Selenium WebDriver implementation: `src/browsers/seleniumWebdriver.ts`
  - Factory + descriptor registry: `src/browsers/factory.ts` (`BrowserFactory`, `getDescriptor`)
- **Agent Code**: `src/agent/`
  - Framework detection and QUnit hooks
  - Result collection via `AgentTestResultsBuilder`
  - State exposed on `window['ui5-test-runner']` for CLI polling
- **Orchestration**: `src/modes/test/index.ts`, `src/modes/test/pageTask.ts`, `src/utils/shared/parallelize.ts`
- **Pre/post hooks**: `src/start.ts` (optional start command), `src/end.ts` (optional end command)
- **CLI entry point**: `src/cli.ts` (parses config and routes to the appropriate mode)
- **Configuration**: `src/configuration/` (parallelization and other options)

## Agent Execution Lifecycle

1. **Launch**: CLI creates a **single** browser instance
2. **Inject**: Agent scripts are registered via `evaluateOnNewDocument`/`addInitScript` on each new page before navigation
3. **Navigate**: Navigation resolves at DOMContentLoaded readiness (not full `load`); the agent then detects a supported test framework (QUnit or `window.suite`) on the `load` event (see [Navigation Readiness](#navigation-readiness))
4. **Execute**: Agent hooks into the test framework and records results
5. **Poll**: CLI polls `window['ui5-test-runner'].state` at a configurable interval until `state.done === true`
6. **Collect**: CLI reads `window['ui5-test-runner'].results` from the page
7. **Cleanup**: Page (window) is closed; browser instance remains open for subsequent pages

## Configuration Options

Key configuration parameters:
- `parallel`: Number of concurrent page tasks (default: **2**)
- `driver`: Which automation driver to use (`puppeteer` (default), `playwright`, `webdriverio`, `selenium-webdriver`)
- `browser`: Which actual browser to launch (default: driver's default; see ADR-0013)
- `pageTimeout`: Fail a page if it takes longer than this duration
- `globalTimeout`: Fail remaining pages if the total run exceeds this duration
- `failFast`: Stop the whole execution after the first failing page
- `agentDetectionTimeout`: Maximum time to wait for a test framework to be detected after page load (default: 5000 ms)
