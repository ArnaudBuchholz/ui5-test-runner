# Coding Guidelines

## Scope

These guidelines apply to all implemented modules across any project. They do not apply to tooling configuration files (e.g., `vite.config.ts`, `vitest.config.ts`, `eslint.config.ts`).

---

## Code Structure

### One concept per file

Each file must represent a single concept. The file name must clearly reflect what is inside it.

### File size

A file should not exceed **200 lines**. This is not enforced by linting but serves as a signal that the file is doing too much and should be split.

### File naming

- **camelCase** for modules that do not expose a class (e.g., `suiteFilter.ts`, `urlHelpers.ts`)
- **PascalCase** for modules that expose a class or a factory returning a typed interface (e.g., `SuiteFilter.ts`, `CommandLine.ts`)

### Splitting a concept

When a file grows beyond ~200 lines or a concept becomes too large to implement in a single file:
- Move the concept into a **subfolder** named after the concept
- Split the implementation into focused files inside that subfolder
- Do **not** create catch-all helper files (e.g., avoid `fooHelpers.ts`)

### Exports

- Always use **named exports**
- Default exports are **forbidden** in implemented modules
- This rule does not apply to tooling configuration files where `export default` is required by convention

---

## TypeScript

### Type safety

- Avoid `any` whenever possible; prefer `unknown`
- Avoid type assertions (`as`) in implemented modules; use **typeguard functions** to narrow types after validation
- Type assertions are acceptable in test files where the data is fully controlled

### Interfaces and types

- Use `interface` when defining the shape of an object or a contract (e.g., what a factory returns)
- Use `type` for aliases, unions, intersections, and mapped types
- Use `readonly` on properties when the value is not expected to change after construction
- Rely on **TypeScript type inference** whenever possible; do not annotate types that are already inferred
- Always specify **explicit return types** on exported and public functions

### Factory functions

When dependency injection is needed, prefer **factory functions** that return a typed interface:

```typescript
interface MyService {
  doSomething: (input: string) => Result;
}

const createMyService = (dependency: Dependency): MyService => {
  return {
    doSomething: (input) => { ... }
  };
};
```

Functions have a maximum of **3 parameters**. Do not inject dependencies as additional function parameters; use factory functions instead.

---

## Linting

- All implemented modules must pass `eslint` with the project's configuration without modification
- `eslint-disable` at file or block level is **forbidden**
- `eslint-disable-next-line` is allowed **only** as a last resort, when the situation cannot be resolved by changing the code
- Before adding `eslint-disable-next-line`, **ask** whether an exception is acceptable
- Every `eslint-disable-next-line` comment **must** include an explanation:

```typescript
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- Cannot change the base type definition of errors
```

---

## Testing

### General rules

- Test files use the `.spec.ts` extension and are placed **in the same folder** as the file being tested
- Only **logic** is unit tested; UI rendering is not tested
- Unit tests must be **small and fast**
- Each test case should have **a single clear expectation** or a small number of tightly related expectations; if a test requires more than a few expectations, split it into smaller test cases so that **errors are clear and concise**
- Tests must cover both **happy path and edge cases**
- Coverage is **not enforced** but coverage gaps on edge cases should be intentional and documented

### Test case naming

Use the affirmative style:

```typescript
it('returns the filtered list when status is failed')
it('throws when the input is missing')
```

### `describe` nesting

- A top-level `describe` block is not required
- Nest `describe` blocks when tests are **logically grouped** or when `beforeEach` / `afterEach` / `beforeAll` / `afterAll` apply to a specific group
- Maximum nesting depth: **5 levels**

```typescript
describe('when the suite is empty', () => {
  beforeEach(() => { ... });

  it('returns no suite label')
  it('still displays the test name')
});
```

### Mocking

- Prefer **dependency injection via factory functions** to avoid mocking at the module level
- When dependency injection is not applicable, use `vi.mock()` at the **module level**
- Manual mocks (`__mocks__` folder) are not preferred

---

## UI5 Web Components

### Usage

- Use UI5 Web Components to keep the application style consistent; prefer them over plain HTML elements
- Avoid complex or deeply nested component compositions; keep the interface simple

---

## Verification before delivery

Before declaring any implementation complete, the following commands **must** be run and must pass with zero errors:

```bash
npm run lint       # ESLint + type check — zero errors required
npm run test:unit  # All unit tests must pass
```

These are not optional quality steps — they are part of the definition of done. Code that has not been verified against these commands is not considered implemented.

---

## Change Scope

Each change must have a **single purpose**:

- **Fix**: corrects an existing behavior
- **Feature**: implements something new
- **Refactor**: improves structure without changing behavior

Mixing purposes in a single change is not acceptable. For example, do not fix a bug and refactor unrelated code in the same change.
