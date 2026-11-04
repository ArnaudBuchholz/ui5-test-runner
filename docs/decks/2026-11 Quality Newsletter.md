# Rebuilding ui5-test-runner with help from AI

My name is Arnaud Buchholz, official title "Application Engineering Expert", and I have been working the last 12 years at SAP.

A good chunk of those years went into UI5 development, some UI5con sessions (in particular [UI5con@SAP 2018 - A journey with OPA](https://youtu.be/HiZq-kuIbt0)) and two co-authored books:

* [Testing SAPUI5 Applications](https://www.sap-press.com/testing-sapui5-applications_5056/)
* [Clean SAPUI5](https://www.sap-press.com/clean-sapui5_5479/)

Currently UI5 is no longer part of the day job, but — on top of other duties — the role of principal maintainer of `ui5-test-runner` remains.

If you want to learn more about the project itself, here are some interesting links :
* The initial concept *(version 1)* is explained in the article [REserve - Testing UI5](https://arnaud-buchholz.medium.com/reserve-testing-ui5-85187d5eb7f1)
* [A different approach to UI5 tests execution](https://youtu.be/EBp0bdIqu4s), a live presentation from [UI5Con'21](https://openui5.org/ui5con/)
* [ui5-test-runner v3](https://www.youtube.com/live/kxmmdy1tho4), a live presentation from [Devtoberfest](https://www.youtube.com/playlist?list=PL6RpkC85SLQDHz97qsNTNAE2jnUKj8X5d)

Today, this [package](https://www.npmjs.com/ui5-test-runner) gets around 20,000 downloads a week and a hundred teams, internal and external, visible in weekly npm telemetry, rely on it to run their UI5 test suites in CI.

Looks like a success story, but the day-to-day reality behind it is a steady trickle of issues landing in the inbox, each one costing hours to reproduce and qualify, on a codebase that had slowly stopped being enjoyable to work on.

This article covers the rebuild of version 6, how AI was put to work without losing control of the result, and the MCP server built to help teams migrate.

## Why ui5-test-runner@6 exists

Version 5 worked. That's the _uncomfortable_ part: it wasn't broken but it was *tired*.

After several years of adding features to support every request teams could throw at it, the architecture had quietly turned into something no one wanted to touch.

A few concrete pain points, because "legacy code is hard" is too vague to be useful:

- **No type safety, silent failures.** The whole codebase was written in JavaScript. The option parser alone was around 500 lines. Adding a `start` option once collided with an internal `start` timestamp — hours of debugging *wrong timings* followed. Nothing crashed. It just lied, _quietly_.

- **Tracing you had to earn.** When a team reported "it fails on CI but not on our machines," the workflow was: enable traces via options, re-run and wait, collect the scattered trace files (one per spawned process), squint at the clutter, and usually loop back to step one. Version 5 didn't tell you what happened by default.

- **The browser model fought the browser.** A full browser *process* is spawned per test page, probed for readiness, *then* used to run the tests. Each process meant ~2 seconds of pure startup overhead and a cold cache, so UI5 resources were re-downloaded again and again. For simple QUnit suites, teams complained that Karma was faster and - _sadly_ -  they were right.

- **Chrome moved the goalposts.** Recent Chrome versions blocked `localhost` access from a remote URL. The common workaround is to disable browser security : not scalable, not safe, and it erodes trust in the tool.

Three options existed: keep patching (unsustainable), onboard a second maintainer (impossible as the code was too brittle to hand over), or rebuild with guardrails. Worth the bet: a few months of work to save thousands of hours downstream and, just as importantly, to produce something *someone else could maintain*.

Version 6 is a complete rewrite in TypeScript, organized around three ideas:

1. **Reliability** a single, structured, queryable trace written by default, so a run tells its own story. No more "turn on logging and try again."
2. **Speed** one browser, many tabs. Native browser cache. An in-page *agent* that the runner polls, instead of the old probe-then-POST dance. The probe step is simply gone. On complex suites this is roughly 30% faster, and on the OpenUI5 challenge (31K+ tests) a run that took ~15 minutes on version 5 came down to ~6 minutes.
3. **Maintainability** clear interfaces, threads instead of processes where it helps, and a documentation system designed to be read by **both** humans and machines.

### Architecture shift

In version 5, the runner spawns a browser per page, and the progress is monitored by having the browser post back informations to the runner.

_Each box below is a separate OS process; the runner coordinates them over HTTP._

![v5 architecture](v5%20architecture.png)

In version 6, only one browser is used and a tab is opened for each page. An agent is injected in the page and it collects progress. The runner queries the agent state to monitor the progress.

_A single browser process now hosts all tabs; the runner polls each tab's in-page agent over the Chrome DevTools Protocol._

![v6 architecture](v6%20architecture.png)

### Quality metrics

The quality metrics back the feeling, measured with [sabik](https://www.npmjs.com/package/sabik):

| |@5|@6|
|-|--|--|
|Language|JavaScript|TypeScript|
|[Cognitive complexity](https://www.sonarsource.com/docs/CognitiveComplexity.pdf)|6.72|3.85|
|[Cyclomatic complexity](https://en.wikipedia.org/wiki/Cyclomatic_complexity)|4.19|3.2|
|[Maintainability](https://docs.microsoft.com/en-us/visualstudio/code-quality/code-metrics-maintainability-index-range-and-meaning?view=vs-2019)|82.58|84.64|
|[Bugs delivered](https://en.wikipedia.org/wiki/Halstead_complexity_measures) (1️⃣)|54.26|39.43|
|Lines of code|11605|10762|

_1️⃣: The Halstead metric estimates the total number of bugs latent in the codebase as a whole. On average, software projects tend to experience between 15 to 50 bugs per 1,000 lines of code._

Fewer lines, far less complexity, and the "start option conflict" category of bug simply can't happen anymore, because the type system refuses it at design time.

## Part 2 — Building it with AI, guided by Architecture Decision Records

Here's where I expect some eyebrows to go up, so let me be honest about what worked and what didn't.

AI was genuinely excellent at the things that are tedious but low-risk: scaffolding UI components from a text wireframe, converting the CTRF report into other formats, writing the first draft of a test. It saved me real weeks.

It was *dangerous* on the things that matter most. Early on I let it take a pass at the browser-spawning and lifecycle logic. The output looked plausible — clean, confident, well-named — and it had subtle race conditions that would have been a nightmare to diagnose in the field. That's the trap with a capable model: it is articulate about code it got wrong.

The lesson I took away is that AI doesn't need *more* freedom, it needs *better constraints*. And the single most effective constraint turned out to be **Architecture Decision Records**.

An ADR is a short document capturing one decision: the context, the choice, and the consequences. I keep [fourteen of them](../adr/index.md), one per load-bearing part of the system — the platform abstraction layer, the parallel browser agents, configuration validation, logging and tracing, graceful shutdown, and so on. Each one states not just *what* the architecture is but *why*, including the constraints that are easy to violate by accident.

Three things changed once the ADRs existed:

- **The AI stopped reinventing decisions.** When I ask it to touch `src/configuration/`, it reads ADR-0003 and follows the multi-stage validation model that's already there instead of inventing a fourth way to parse options. The project's `CLAUDE.md` points every session at the ADR index, so this isn't something I have to remember to say each time.
- **I had something to review the AI *against*.** Reviewing a diff in isolation, you can only check "does this look right?" Reviewing it against a written decision, you can check "does this honor the decision we made?" That's a much sharper question, and it catches the confident-but-wrong output before it lands.
- **The documents keep each other honest.** The ADRs are reviewed *alongside* the documentation, not as an afterthought. I even have a small `/doc-review` routine that checks doc files against the actual source. When the code and the record drift apart, that's a signal, not a surprise.

`/doc-review` works by reading each documentation file and the source files it describes, then checking for contradictions: an option the doc mentions that no longer exists, a default value that has drifted, a behaviour the doc asserts that the code no longer exhibits. It is not a linter — it cannot catch a gap (something the code does that the doc never mentions), only a conflict. But conflicts are the dangerous kind: a gap leaves a user uninformed, a conflict actively misleads them. Running it on every PR that touches `src/` or `docs/` catches the most common drift before it compounds.

I also codified the behavior I wanted from the AI itself. One rule I keep coming back to: *defend only against reachable states*. If the model wants to add a null-check or a retry, it has to be able to name a concrete, reachable path that triggers it — otherwise that "defensive" branch is just dead complexity hiding the real failure modes. And the workflow bias is tests-first: "fix the bug" becomes "write a failing test that reproduces it, then make it pass."

So the division of labor settled into something like: **AI writes the UIs, the boilerplate, the format converters, and the first draft of tests. The critical paths — browser lifecycle, state management — I design via an ADR and keep a tight hand on. Everything gets a human review against a written decision.** Go fast on what's safe, go slow on what's risky.

## Part 3 — An MCP server, and letting an LLM prove the docs actually work

This is the part that's most interesting for a quality audience, because it's testing a thing that doesn't fit the usual pass/fail mold.

Here's the problem. v6 is a complete rewrite with major breaking changes, and in the AI era users don't *read* migration guides — they ask an assistant. The documentation still has to exist and be correct, but it also has to be *reachable* by the tools people now use to answer their questions. I couldn't just point an assistant at the `docs/` folder on GitHub and hope, and I certainly wasn't going to embed an LLM inside the test runner.

So the docs in v6 are built documentation-first. Options are *designed* as markdown with frontmatter — keywords, relations between topics — before any code is written. (There's even an `/add-option` skill that enforces this: you write the doc, then regenerate the option definitions from it, never the other way around.) That gives the documentation a real structure, not just prose.

Then I expose that structure over the **Model Context Protocol**. Running `ui5-test-runner --mcp` starts a small web server offering exactly two tools:

1. `list_topics` — returns the *structure* of the knowledge base.
2. `get_topic` — returns the *content* of a topic.

Plus a set of instructions that tell the client to treat this documentation as **authoritative**. That last word matters: it's the difference between an assistant guessing from its training data and an assistant answering from the current, correct docs.

Now the quality question that kept me up: **how do I know the documentation actually works?** Not "is the markdown valid" — does an assistant, given a realistic question and this knowledge base, arrive at a *correct* answer? That's not a conventional assertion. The output is natural language, and it's slightly different every time.

The approach I landed on is an LLM-as-judge harness. Each test case is a small `config.toml` describing a scenario:

```toml
[user]
question = "How do I migrate to ui5-test-runner 6 ?"

[files]
"package.json" = """{ "devDependencies": { "ui5-test-runner": "^5" } }"""
"ui5-test-runner.json" = """{ "reportGenerator": ["$/report.js"] }"""

[expected]
v6 = "It should explain how to migrate the project to version 6"
config = "it should explain that reportGenerator is no more supported"
```

Three parts: the `[user]` question, a `[files]` block simulating the project's file system so the scenario is concrete, and `[expected]` — the criteria a good answer must satisfy, written in plain language.

Two harnesses then do the work. The **query** harness connects to the live MCP server and lets the model answer the question, exactly as a real assistant would. The **judge** harness takes that answer and scores it against each expected criterion, emitting a per-criterion verdict and a report. The thing being validated isn't a string — it's whether the documentation, as exposed, is *enough* for a model to reach the right conclusion.

One thing worth naming: the judge is itself a model, so it inherits the same noise property as the query. A single judge verdict can be wrong in either direction — a genuine gap scored as a pass, or a correct answer penalised for phrasing. Repeating the full cycle (query + judge) five times means you're not just averaging out the query's variance; you're averaging out the judge's too. The pass rate you measure is the pass rate of the whole pipeline, end to end.

The last piece is the one that made this trustworthy rather than flaky. LLM answers are noisy; a single run tells you very little. So the harness supports repetition:

```
ui5-test-runner --mcp --watch     # keep the docs server live while iterating
npm run test:mcp --repeat 5       # run each case five times
```

Running each case five times turns a brittle pass/fail into a **pass rate**, and the pass rate is diagnostic in a way a single verdict never is. Zero out of five means a genuine gap in the documentation — the model couldn't get there no matter what. A mixed result (say three of five) means the content is *present but not reliably findable* — maybe the topic needs a sharper keyword or an explicit cross-reference. My working rule is simply: **fix the cases that fail more than once.** That filters out the one-off noise and points me straight at the docs that need work. The fix is usually small — add a keyword to the frontmatter, drop an explicit cross-reference, or rewrite a summary so the question maps to it — then re-run with `--repeat 5` to confirm the pass rate recovers. That closes the loop between "write documentation" and "prove it answers the question."

## Takeaways

If I compress all of this into a few lines for the next person maintaining something at scale:

- **The refactor was never the goal — sustainability was.** TypeScript, the trace system, the tab-based browser model: those are means. The end was a tool someone other than me could confidently change.
- **Give AI constraints, not freedom.** It's brilliant at scaffolding and boilerplate, and genuinely risky in the orchestration-heavy critical paths. ADRs were the single best lever: they stopped it reinventing decisions and gave me something concrete to review its output *against*.
- **Document for the AI, not just for humans** — then expose those docs over MCP and make them authoritative.
- **Let an LLM judge prove the docs work, and repeat the test to separate a real gap from noise.** A pass rate tells you more than a verdict.

Version 6 is out. Come kick the tires — and, as always, send feedback. For a tool a hundred teams, internal and external, visible in weekly npm telemetry, depend on, that feedback loop is the whole point.
