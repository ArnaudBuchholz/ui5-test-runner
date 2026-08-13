# ADR-0001: Platform Abstraction Layer

## Status
Accepted

## Context

Node.js provides powerful native APIs (fs, http, process, etc.), but directly depending on them throughout the codebase creates several problems:

1. **Testability**: Tests must either mock Node.js modules or run actual file I/O, making tests slower and less deterministic
2. **Portability**: Code is tightly coupled to Node.js APIs, making it harder to adapt or use in different environments
3. **Maintainability**: Scattered Node.js API calls make it difficult to track dependencies and change APIs consistently
4. **Flexibility**: Switching implementations (e.g., different HTTP clients) requires changes throughout the codebase

The `ui5-test-runner` executes tests in browsers, coordinates multiple processes, and reads/writes configuration files, all operations that need to be testable without side effects.

## Decision

Create a **Platform Abstraction Layer** (`src/platform/`) that wraps Node.js APIs behind mockable static classes:

```
src/platform/
├── assert.ts       (Custom assert using logger before throwing)
├── constants.ts    (__sourcesRoot, __developmentMode)
├── environment.ts  (logEnvironment utility)
├── Exit.ts         (Async-task lifecycle + SIGINT handler)
├── FileSystem.ts   (fs/promises + fs stream wrappers)
├── Host.ts         (OS / process metadata: cpus, cwd, env, pid, platform, …)
├── Http.ts         (fetch-based HTTP client with logging + abort)
├── Module.ts       (createRequire, findPackageJSON)
├── Path.ts         (path module wrappers)
├── Process.ts      (child_process spawn wrapper + IProcess interface)
├── Terminal.ts     (stdout/stdin TTY helpers + ANSI escape constants)
├── Thread.ts       (worker_threads: Worker, BroadcastChannel, threadId)
├── Url.ts          (pathToFileURL)
├── ZLib.ts         (gzipSync, deflateRawSync, inflateRawSync)
├── logger/         (Worker-based structured logging subsystem)
├── version.ts      (reads package.json for version string)
├── mock.ts         (vi.mock() stubs for all modules — imported in tests)
└── index.ts        (re-exports all of the above)
```

Each module is a **static class** (or a plain object/function for modules like `Http`, `logger`, `assert`). There is no aggregate `IPlatform` interface and no dependency-injection pattern. The single exception is `IProcess`, which is an interface exported from `Process.ts` and used as a return type for `Process.spawn` to allow test doubles.

Mocking is centralised in `mock.ts`, which uses Vitest's `vi.mock()` to replace every module with a spy-friendly version. Test files import `mock.ts` as a side-effect to activate all mocks at once.

## Consequences

### Positive
- ✅ **Testability**: Code can be tested without touching the file system,  network, or spawning processes
- ✅ **Maintainability**: All Node.js API usage is centralized and consistently wrapped
- ✅ **Mockability**: `mock.ts` provides a single import that activates vi.mock stubs for every platform module
- ✅ **Gradual Refactoring**: Abstractions can be introduced incrementally without rewriting the entire codebase

### Negative/Trade-offs
- ❌ **Indirection**: Every file operation goes through an abstraction layer (minimal performance impact)
- ❌ **Complexity**: Added layer of code to understand and maintain
- ❌ **Static coupling**: Static classes cannot be swapped via dependency injection; swapping requires `vi.mock` in tests

### Mitigation
- Provide clear, focused modules (not god objects)
- Keep implementations thin (delegate to Node.js APIs, don't duplicate logic)
- Centralise all mocking in `mock.ts` to avoid per-test boilerplate

## Related Files & Modules
- **Usage**: Throughout `src/cli.ts`, `src/configuration/`, `src/reports/`, `src/modes/`, `src/start.ts`, `src/end.ts`
- **Tests**: Selected platform modules have `.spec.ts` files (`Exit.spec.ts`, `Http.spec.ts`, `Process.spec.ts`, `Terminal.spec.ts`, `Thread.spec.ts`); thin wrappers are intentionally untested (noted in `platform/README.md`)
- **Mock helper**: `src/platform/mock.ts` — import this file in a test setup or at the top of a spec to activate all platform mocks
- **Entry Point**: `src/platform/index.ts` re-exports every module by name; there is no singleton platform instance

## Example Usage

```typescript
// ✅ Good: Import the static class and call its methods directly
import { FileSystem } from './platform/index.js';

const config = await FileSystem.readFile('test-config.json', 'utf8');

// ✅ Good: Use IProcess interface for test doubles
import type { IProcess } from './platform/index.js';

const makeProcess = (code: number): IProcess => ({
  pid: 1,
  stdout: '',
  stderr: '',
  code,
  closed: Promise.resolve(),
  kill: async () => {}
});

// ❌ Avoid: Direct Node.js API usage (bypasses mock.ts and logging)
import fs from 'node:fs/promises';
const config = await fs.readFile('test-config.json', 'utf8');
```
