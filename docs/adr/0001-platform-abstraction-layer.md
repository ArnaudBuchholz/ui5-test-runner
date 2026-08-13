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

Create a **Platform Abstraction Layer** (`src/platform/`) that wraps Node.js APIs behind a testable, injectable interface:

```
src/platform/
├── fs/          (File System abstraction)
├── http/        (HTTP client abstraction)
├── process/     (Process management abstraction)
├── threading/   (Threading/Worker abstraction)
├── url/         (URL handling abstraction)
├── compression/ (Compression utilities abstraction)
└── index.ts     (Platform facade)
```


Each module exports:
- An **interface** defining the contract (e.g., `IFileSystem`)
- An **implementation** using Node.js APIs
- A **factory** to instantiate the implementation

## Consequences

### Positive
✅ **Testability**: Code can be tested without touching the file system, network, or spawning processes
✅ **Flexibility**: Implementations can be swapped (e.g., for different runtimes or test mocking)
✅ **Maintainability**: All Node.js API usage is centralized and versioned consistently
✅ **Documentation**: Interfaces serve as documentation of platform dependencies
✅ **Gradual Refactoring**: Abstractions can be introduced incrementally without rewriting the entire codebase

### Negative/Trade-offs
❌ **Indirection**: Every file operation goes through an abstraction layer (minimal performance impact)
❌ **Complexity**: Added layer of code to understand and maintain
❌ **Boilerplate**: Creating implementations and mocks requires more code

### Mitigation
- Use dependency injection to keep abstractions transparent
- Provide clear, focused interfaces (not god objects)
- Keep implementations thin (delegate to Node.js APIs, don't duplicate logic)
- Include examples in module documentation

## Related Files & Modules
- **Usage**: Throughout `src/cli.ts`, `src/agent/`, `src/configuration/`, `src/reports/`
- **Tests**: Each platform module should have corresponding `.spec.ts` test file with mocked implementations
- **Entry Point**: `src/platform/index.ts` exports the default platform instance

## Example Usage

```typescript
// ✅ Good: Use injected platform
export class TestRunner {
  constructor(private platform: IPlatform) {}
  
  async run() {
    const config = await this.platform.fs.readFile('test-config.json');
  }
}

// ❌ Avoid: Direct Node.js API usage
import fs from 'fs';
const config = fs.readFileSync('test-config.json');
