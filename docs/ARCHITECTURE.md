# Architecture

`ui5-test-runner` is a Node.js CLI that drives a browser to execute UI5 (QUnit / OPA5) test pages and produces [CTRF](https://ctrf.io) JSON and HTML reports.

---

## Overview

```
┌────────────────────────────────────────────────────────────────────┐
│  ui5-test-runner                                                   │
│                                                                    │
│   ┌──────────────────────────┐          ,────────────────────,     │
│   │                          │ ──────► (       report         )    │
│   │           core           │          '────────────────────'     │
│   │                          │          ,────────────────────,     │
│   │                          │ ──────► (        logs          )    │
│   └────────────┬─────────────┘          '────────────────────'     │
│                │                                                   │
│           ◄IBrowser►                                               │
│                │                                                   │
│   ┌────────────┴─────────────┐                                     │
│   │  puppeteer / playwright  │                                     │
│   └────────────┬─────────────┘                                     │
└────────────────│───────────────────────────────────────────────────┘
                 │
            ◄IWindow►
                 │
┌────────────────│───────────────────────────────────────────────────┐
│  Browser       │                                                   │
│   ┌────────────│─────────────────────────────┐                     │
│   │  Window    ▼                             |                     │
│   │   ┌──────────────────────────────────┐   |   ,────────────,    │
│   │   │  agent                           │◄─────(    cache     )   │
│   │   │  (injected by ui5-test-runner)   │   |   '────────────'    │
│   │   └──────────────────┬───────────────┘   |                     │
│   │                      ▼                   |                     │
│   │              ,───────────────,           |                     │
│   │             (   agent state   )◄──────────── polled by core    │
│   │              '───────────────'           |                     │
│   └──────────────────────────────────────────┘                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## System layers

```
┌──────────────────────────────────────────────────────────────────────┐
│  cli.ts                                                              │
│  CommandLine ──► ConfigurationValidator ──► execute(configuration)   │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                ▼                ▼                 ▼
          help / version        log             test
                                                  │
┌─────────────────────────────────────────────────┼────────────────────┐
│  modes/test/                                    ▼                    │
│                                                                      │
│  start ──► server ──► browser ──► parallelize(pageTask) ──► end      │
└──────────────────────┬──────────────────┬────────────────────────────┘
                       │                  │
           ┌───────────┘                  └──────────────┐
           ▼                                             ▼
┌──────────────────────┐               ┌────────────────────────────┐
│  src/browsers/       │               │  src/agent/                │
│  IBrowser            │               │  agent.js  (browser-side)  │
│  ├─ puppeteer.ts     │               │  ├─ qunit.ts               │
│  └─ playwright.ts    │               │  ├─ state.ts               │
└──────────────────────┘               │  └─ report.ts              │
                                       └────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│  src/platform/  (all node:* access goes through here)                │
│  Exit · Thread · Process · Http · FileSystem · Path · logger · Host  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Test execution flow

```
  test(configuration)
        │
        ├─ initReportBuilder
        ├─ Folder.create(reportDir)
        ├─ logger.start
        ├─ getAgentSource          memoized read of dist/ui/agent.js
        │
        ▼
  server.start ──── spawn Worker thread ──── REserve listens on :port
        │
        ├── serveOnly? ──yes──► block until CTRL+C
        │
        ▼
  setupBrowser  (Puppeteer or Playwright)
        │
  initBrowserConfig  (build window['ui5-test-runner'].config snippet)
        │
        ▼
  parallelize(pageTask, urls, { parallel })
  │
  └─ pageTask(url) ──► browser.newWindow({ scripts: [config, agent], url })
                             │
                         poll window['ui5-test-runner'].state  (every 250ms)
                             │                                 (every 1s for OPA5)
                         collect results ──► reportBuilder.merge(url, results)
        │
        ▼
  reportBuilder.finalize ──► report.json
        │
  generateHtmlReport ──────► report.html
        │
  end(configuration)         optional post-command
```

---

## HTTP server — Worker thread isolation

The REserve HTTP server runs in a dedicated Worker thread so its event loop does not interfere with the page-polling loop on the main thread. The two sides communicate over a named `BroadcastChannel`.

```
  Main thread               BroadcastChannel 'server'         Worker thread
       │                                                            │
       │── Thread.createWorker('modes/test/server', config) ───────►│
       │                                                            │── serve(REserveConfig)
       │◄────────────── { command: 'ready', port } ─────────────────│
       │  server.start() resolves                                   │
       │                                                            │
       :                 (test run in progress)                     :
       │                                                            │
       │──── { command: 'terminate' } ─────────────────────────────►│
       │                                                            │── server.close()
       │◄────────────── { command: 'terminated' } ───────────√──────│
       │  server.stop() resolves                                    │
```

**REserve mapping order** (first match wins):

```
GET /resources/**        →  proxy to --ui5 base URL
GET /test-resources/**   →  proxy to --ui5 base URL
GET /**                  →  static file from --webapp directory
(unmatched)              →  warn log + 404
```

---

## Page task — polling loop

```
  pageTask(url)
        │
        ├─ Exit.registerAsyncTask({ name: url, stop: … })
        │
        ▼
  browser.newWindow({ scripts: [browserConfig, agentSource], url })
        │
        │  browser loads page → agent.js runs → detects page type
        │
        ▼
  loop (every 250ms, 1 000ms for OPA5)
  │
  │  page.eval("window['ui5-test-runner'].state")
  │                │
  │      ┌─────────┴──────────┐
  │      │ state.done = false │──► log progress, continue loop
  │      │ state.done = true  │──► exit loop
  │      └────────────────────┘
  │
  └─ on exit:
        ├─ suite page  ──► push discovered URLs into shared queue
        └─ QUnit/OPA5  ──► page.eval("window['ui5-test-runner'].results")
                                │
                           reportBuilder.merge(url, results)
        │
        ▼
  page.close()
```

**AgentState** is a tagged union driven by the agent:

```
'loading'  →  page not ready yet
'QUnit'    →  { executed, total, errors, done, isOpa }
'suite'    →  { done: true, pages: string[] }
'unknown'  →  unrecognised page (fatal)
```

---

## Graceful shutdown — Exit registry

Every resource registers with `Exit` on creation and unregisters automatically when its scope exits (TC39 `using` / `Symbol.dispose`). On `Exit.shutdown()`, tasks stop in **LIFO order**.

```
  SIGINT / error
        │
        ▼
  Exit.shutdown()
        │
        ▼  tasks stopped in reverse registration order
  ┌───────────────────────────────────┐
  │  Exit._asyncTasks                 │
  │                                   │
  │  [0] server                       │
  │  [1] pageTask /foo.html           │
  │  [2] pageTask /bar.html  ◄─ stop  │
  │  [3] Process.spawn(start)         │
  └───────────────────────────────────┘
        │
        ▼
  logger.stop()
```

`registerAsyncTask` throws `ExitShutdownError` if shutdown has already started. Page tasks catch this via `parallelize`'s stop mechanism; `logger.error` auto-downgrades `ExitShutdownError` to `debug` to avoid noise during normal shutdown.

---

## start / end commands

Optional lifecycle hooks that wrap the test run.

```
┌─────────────────────────────────────────────────────────────────┐
│                         test run                                │
│                                                                 │
│  [start command] ──── server ──── browser ──── [end command]    │
│        │                                             │          │
│  poll --start-wait-url                     optional timeout     │
│  every 250ms until ok                      (--end-timeout)      │
└─────────────────────────────────────────────────────────────────┘
```

`start.ts` kills the process and throws if it exits before the URL responds or `--start-timeout` elapses. `end.ts` waits for the command to close naturally, or kills it after `--end-timeout`.

---

## Platform abstraction

All `node:*` imports are confined to `src/platform/`. Nothing outside this folder may import from `node:*` directly. `platform/mock.ts` provides `vi.fn()` stubs for every export — spec files call `vi.mock(import('../platform/mock.js'))` and never mock `node:*` directly.

```
src/platform/
  Exit.ts          – LIFO async task registry, SIGINT handler
  Thread.ts        – worker_threads wrapper (createWorker, createBroadcastChannel)
  Process.ts       – child_process.spawn wrapper; auto-registers with Exit
  Http.ts          – fetch / getAsText
  FileSystem.ts    – fs read/write (sync + async)
  Path.ts          – node:path
  Url.ts           – node:url
  ZLib.ts          – node:zlib
  Host.ts          – process / os (argv, cwd, env, platform, cpus…)
  Terminal.ts      – node:readline
  Module.ts        – node:module (createRequire)
  logger.ts        – structured logger (debug/info/warn/error/fatal)
  assert.ts        – internal invariants (never throw new Error directly)
  mock.ts          – centralised Vitest mock for all of the above
```

---

## Report pipeline

```
  pageTask (per URL)
        │
        │  reportBuilder.merge(url, results)
        ▼
  TestReportBuilder
        │
        │  .finalize()
        ▼
  report.json  (CTRF)
        │
        ▼
  generateHtmlReport
        ├── window.ctrf = { …report data… }       inlined JSON
        ├── lib.js  (UI5 web-components)          inlined bundle
        └── html-report.js  (report viewer app)   inlined bundle
        │
        ▼
  report.html  (fully self-contained)
```

---

## UI bundles

Built separately by Vite (`iife` format, CSS injected by JS, terser minified). They run in a browser context — Node.js rules do not apply.

```
src/agent/      →  dist/ui/agent.js        injected into every test page
src/ui/report/  →  dist/ui/html-report.js  interactive report viewer
src/ui/log/     →  dist/ui/log-viewer.js   interactive log viewer
```

Each UI follows a strict **MVC split**:

```
Controller (src/reports/ui/ReportController.ts)
  holds all state, exposes IUserInterfaceController<Settings, State, Actions>

View (src/ui/report/)
  wires DOM → controller.interaction({ changedField })
  applies update(changed) patches for fields present in the changed object only
  no business logic
```
