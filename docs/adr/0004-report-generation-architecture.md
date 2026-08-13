# ADR-0004: Report Generation Architecture

## Status
Accepted

## Context

Test execution and report generation have traditionally been tightly coupled:
- Tests run → immediately formatted into final report
- Adding new report formats requires modifying test execution code
- Real-time result viewing is difficult without a unified data model
- Report generation is a performance bottleneck during test execution

The ui5-test-runner needs to support multiple outputs simultaneously:
1. **HTML reports** for manual inspection
2. **JUnit XML** for CI/CD systems (Jenkins, GitLab CI)
3. **Real-time UI** showing progress during execution
4. **JSON exports** for tooling integration
5. **Console output** with structured logging

Tightly coupling test execution to each format creates duplication and maintenance burden.

## Decision

Implement a **Decoupled Report Generation Pipeline**:

```
┌─────────────────────────────────────────────────────────┐
│ Test Execution (Browsers + Agent)                       │
│ - Tests run in parallel                                 │
│ - Agent collects raw results                            │
└─────────────┬───────────────────────────────────────────┘
│
│ Normalized test results
▼
┌─────────────────────────────────────────────────────────┐
│ Common Test Report Format (CTRF)                        │
│ - Unified intermediate representation                   │
│ - Language & tool agnostic                              │
│ - Captures: pass/fail, duration, errors, assertions    │
│ - Type: CommonTestReportFormat (src/types/)             │
└─────────────┬───────────────────────────────────────────┘
│
┌────────┼────────┬────────────┬──────────┐
│        │        │            │          │
▼        ▼        ▼            ▼          ▼
┌────────┐┌──────┐┌──────────┐┌────────┐┌──────────┐
│ HTML   ││JUnit ││ JSON     ││Console ││Real-time │
│Report  ││XML   ││Export   ││Output  ││UI Server │
│Gen     ││Gen   ││Gen      ││Gen     ││Gen       │
└────────┘└──────┘└──────────┘└────────┘└──────────┘
│        │        │            │          │
└────────┼────────┴────────────┴──────────┘
│
▼
┌──────────────────┐
│ Output Files &   │
│ Services         │
└──────────────────┘
```


### Key Components

**Common Test Report Format (CTRF) - `src/types/`**
- Single unified data structure for all test results
- Independent of execution engine or report format
- Contains:
  - Test metadata (name, file, duration, tags)
  - Pass/fail status with error details
  - Stack traces and assertion messages
  - Code coverage (if available)
  - Timing and performance metrics

**Report Generators - `src/reports/`**

```
src/reports/
├── generators/
│   ├── html/          (HTML report generation)
│   ├── junit/         (JUnit XML output)
│   ├── json/          (JSON export)
│   └── console/       (Console logging)
├── types.ts           (IReportGenerator interface)
├── pipeline.ts        (Report generation orchestration)
└── index.ts           (Facade)
```


**Real-time UI - `src/ui/` + `src/reports/ui/`**
- Vite-based frontend (`lib/`, `log/`, `report/`)
- Runs as HTTP server during test execution
- WebSocket connection to receive live updates
- Shows progress bar, per-file results, detailed errors

**Agent Instrumentation - `src/agent/`**
- Agent collects raw test results during execution
- Transforms results into CTRF format
- Sends structured data to CLI/Report Pipeline

## Consequences

### Positive
✅ **Decoupling**: Test execution doesn't know about report formats
✅ **Extensibility**: Adding new report format only requires new generator (no touching test code)
✅ **Reusability**: CTRF can be consumed by external tools without reverse-engineering
✅ **Efficiency**: Single format transformation vs. N format-specific transformations
✅ **Real-time Features**: UI server can stream results without blocking test execution
✅ **CI/CD Integration**: Multiple formats support different CI systems simultaneously
✅ **Maintainability**: Changes to data model only affect CTRF transformation, not generators

### Negative/Trade-offs
❌ **Abstraction**: New report format must understand CTRF (requires good documentation)
❌ **Schema Management**: CTRF schema needs versioning as it evolves
❌ **Overhead**: Extra transformation step from execution results → CTRF
❌ **Complexity**: Report pipeline adds code compared to tight coupling

### Mitigation
- Document CTRF schema with examples
- Provide CTRF validators to catch schema violations early
- Include default generators for common formats
- Version CTRF schema explicitly

## Related Files & Modules
- **Data Model**: `src/types/CommonTestReportFormat.ts`
- **Agent Transformation**: `src/agent/` - transforms raw test results to CTRF
- **Pipeline**: `src/reports/pipeline.ts` - orchestrates all generators
- **Generators**: `src/reports/generators/*/`
- **UI Server**: `src/reports/ui/` + `src/ui/` (Vite apps)
- **CLI Integration**: `src/cli.ts` → Report pipeline → output files

## Common Test Report Format (CTRF) Structure

```typescript
interface CommonTestReportFormat {
  testrun: {
    timestamp: string;           // ISO 8601
    duration: number;            // milliseconds
    executionMode: string;        // e.g., "parallel"
    parallelBrowsers: number;    // how many browsers used
    status: 'pass' | 'fail';     // overall result
  };
  
  results: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  
  tests: Array<{
    id: string;                   // unique test ID
    name: string;
    file: string;                 // source file path
    duration: number;             // milliseconds
    status: 'pass' | 'fail' | 'skip';
    errors?: Array<{
      message: string;
      stack: string;
    }>;
    assertions?: {
      total: number;
      passed: number;
      failed: number;
    };
  }>;
  
  coverage?: {                    // optional
    statements: number;           // percentage
    branches: number;
    functions: number;
    lines: number;
  };
}
```

