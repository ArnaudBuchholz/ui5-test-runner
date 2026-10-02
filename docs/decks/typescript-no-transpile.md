# TypeScript Without a Build Step

> How `npm run cli` runs TypeScript source directly in Node — no transpilation, no `dist/`, no watch loop.

## Submission

**Session title:** Running TypeScript in Node without transpiling

**Pitch:**

`ui5-test-runner` is written in TypeScript, yet during local development it runs its `.ts` source *directly* — `npm run cli` boots Node on `src/cli.ts` with zero build step. No `tsc --watch`, no `ts-node`, no bundler in the dev loop, no stale `dist/`.

This talk unpacks the three cooperating features that make it work:

- ✅ Node's native type stripping (`--experimental-strip-types`)
- ✅ A tiny custom module hook (`node:module` `registerHooks`)
- ✅ A `tsconfig` constrained to *erasable* syntax (`erasableSyntaxOnly`)

Attendees leave knowing exactly how to replicate a transpile-free TypeScript dev loop on Node 24.

**Session length:** 20-min Tech Talk / lightning talk

## Plan

* The problem — the classic TS dev loop and its friction
* The one-line trick — the `ts-run` npm script
* Feature 1 — Node type stripping
* Feature 2 — `erasableSyntaxOnly`
* Feature 3 — Node module hooks (the custom resolve/load)
* How the pieces fit together
* Trade-offs and honest caveats
* Takeaways — when to adopt this

---

# Slides

## Intro — the one-liner

> We run TypeScript source in Node with zero transpilation during development.

```json
"ts-run": "node --no-warnings --experimental-strip-types --import ./src/platform/js2ts.mjs",
"cli": "make precli && npm run ts-run -- src/cli.ts"
```

That's the whole trick. The rest of the talk unpacks *why each flag is there*.

---

## The problem

The classic TypeScript dev loop needs a transpiler running alongside you:

- `tsc --watch` → a `dist/` that can go stale, a second process to babysit
- `ts-node` / bundler-in-dev → slower startup, source-map juggling to debug
- Edit → wait for rebuild → run → repeat

**What we want instead:** edit a `.ts` file, run it, done. The source *is* what runs.

Note the deliberate split in this project:
- **Local dev** → `npm run cli` → strip types, run directly
- **Published package** → `make precli` / `build:cli` → real `tsc` emits `dist/`

Same source. Two paths. The build step exists only for the shipped artifact.

---

## Feature 1 — Node type stripping

`--experimental-strip-types` (stable-ish on Node 24, our `.nvmrc` pins `v24.18.0`, `engines` requires `>=24.11.1`).

What Node does: parse the TS, **erase** the type annotations *in place*, run the result as JavaScript.

The key word is **strip**, not **transform**:

- Annotations are blanked out, character positions preserved
- No source maps needed — line/column numbers already match
- Stack traces point at the real `.ts` line

```ts
function greet(name: string): string {   // as written
function greet(name        )         {   // what V8 runs
```

The type information never reaches runtime. It only ever existed for the compiler and your editor.

---

## Feature 2 — `erasableSyntaxOnly`

From `tsconfig.base.json`:

```jsonc
{
  "erasableSyntaxOnly": true,
  "noEmit": true
}
```

Type stripping only works if **every** TS construct can be removed by erasing text. Some TS features *emit runtime code* and cannot simply be stripped:

- `enum` → generates an object
- `namespace` with a body → generates an IIFE
- parameter properties (`constructor(private x)`) → generate assignments

`erasableSyntaxOnly` makes the compiler **reject** all of these. It's a guardrail: it guarantees every file stays strip-safe, so Node never meets syntax it would have to *generate code* for.

> Live proof: `grep -rn "enum \|namespace " src/` → **zero hits.** The constraint is real, enforced on every build.

---

## Feature 3 — Node module hooks

`src/platform/js2ts.mjs`, loaded via `--import` *before* anything else runs. It calls `registerHooks` from `node:module` with two hooks:

**`resolve`** — rewrites `./foo.js` import specifiers to `./foo.ts` when a sibling `.ts` exists:

```js
// import written as "./foo.js"  →  resolved to "./foo.ts"
```

Why? The source always imports with `.js` specifiers — that's what the *compiled* `dist/` needs. The hook lets dev mode map those back to `.ts` on the fly. **One import style, both worlds.**

**`load`** — reads the `.ts` and strips its types before handing it to V8:

```js
const jsSource = stripTypeScriptTypes(source, { mode: 'strip' });
return { format: 'module', source: jsSource, shortCircuit: true };
```

This is the piece Node's flag alone doesn't give you — the `.js → .ts` resolution.

---

## How the pieces fit together

```
node --import js2ts.mjs  src/cli.ts
          │                   │
          │                   └── entry point (real .ts)
          │
          ├── resolve hook:  "./x.js"  →  "./x.ts"
          └── load hook:     read .ts  →  stripTypeScriptTypes()  →  plain JS
                                              │
                                              └── V8 runs it. No build artifact.

tsconfig  ──(never in the runtime path)──►  guardrail only:
                                            type-checks + forbids non-erasable syntax
```

The compiler is the **safety net**; the hook + flag are the **runtime**. They never touch each other at dev time.

---

## Trade-offs & honest caveats

- **Experimental flag** → paired with `--no-warnings` to keep output clean.
- **No type checking at runtime.** Stripping ignores type errors entirely. Types are enforced separately by `npm run lint` → `tsc --build --noEmit`. The dev loop *trusts* the editor + CI for correctness; the runtime only needs valid JavaScript.
- **The published package still uses real `tsc`** (`tsconfig.cli.json` → `dist/`). This technique is for the *dev loop*, not the shipped artifact.
- **Node ≥ 24 only.** Not an option on older runtimes.
- **Discipline tax:** you give up `enum`, runtime `namespace`, parameter properties. In practice: easy, and arguably better style.

---

## Takeaways

**What you need:**
- Node ≥ 24
- `erasableSyntaxOnly: true` in tsconfig
- A ~40-line module hook (`resolve` + `load`)

**What you get:**
- Instant edit → run, no rebuild
- No build artifacts cluttering the dev loop
- A single source of truth — the `.ts` file *is* the program

> Types are a *compile-time* and *editor* concern. At runtime, well-written TypeScript is just JavaScript wearing annotations — so let Node take the annotations off and run it.
