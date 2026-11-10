# Building with AI without losing control: the ui5-test-runner v6 rewrite

My name is Arnaud Buchholz, "Application Engineering Expert" at SAP for the last 12 years. A good chunk of those went into UI5: some UI5con sessions (notably [A journey with OPA](https://youtu.be/HiZq-kuIbt0)) and two co-authored books, [Testing SAPUI5 Applications](https://www.sap-press.com/testing-sapui5-applications_5056/) and [Clean SAPUI5](https://www.sap-press.com/clean-sapui5_5479/). UI5 is no longer part of the day job, but, on top of other duties, the role of principal maintainer of `ui5-test-runner` remains. (For the project's backstory: the [original concept](https://arnaud-buchholz.medium.com/reserve-testing-ui5-85187d5eb7f1), and two talks, [UI5Con'21](https://youtu.be/EBp0bdIqu4s) and [Devtoberfest](https://www.youtube.com/live/kxmmdy1tho4).)

Today, this [package](https://www.npmjs.com/ui5-test-runner) gets around 20,000 downloads a week and a hundred teams, internal and external, visible in weekly npm telemetry, rely on it to run their UI5 test suites in CI.

Looks like a success story, but the day-to-day reality behind it is a steady trickle of issues landing in the inbox, each one costing hours to reproduce and qualify, on a codebase that had slowly stopped being enjoyable to work on.

This article covers the rebuild of version 6 across three angles:

- First, **why it existed at all.** The concrete pain points that made a rewrite the only viable option, and what the new architecture looks like.
- Second, **how AI was used without losing control.** An honest account of where it helped and where it failed, and the constraints (test contracts, ADRs, a doc-review routine) that kept the output trustworthy.
- Third, **a quality engineering problem that came with the territory**: how do you test that documentation actually works when the consumers are LLMs? That last part produced a small, reusable testing pattern (an LLM-as-judge harness with repetition) that may be useful beyond this project.

## Why ui5-test-runner version 6 exists

Version 5 worked. That's the uncomfortable part: it wasn't broken, it was *tired*.

After several years of adding features to support every request teams could throw at it, the architecture had quietly turned into something no one wanted to touch.

A few concrete pain points, because "legacy code is hard" is too vague to be useful:

- **No type safety, silent failures.** The whole codebase was written in JavaScript. The option parser alone was around 500 lines. Adding a `start` option once collided with an internal `start` timestamp: hours of debugging wrong timings followed. Nothing crashed. It just lied, quietly.

- **Tracing you had to earn.** When a team reported "it fails on CI but not on our machines," the workflow was: enable traces via options, re-run and wait, collect the scattered trace files (one per spawned process), squint at the clutter, and usually loop back to step one. Version 5 didn't tell you what happened by default.

- **The browser model fought the browser.** A full browser *process* is spawned per test page, probed for readiness, then used to run the tests. Each process meant ~2 seconds of pure startup overhead and a cold cache, so UI5 resources were re-downloaded again and again. For simple QUnit suites, teams complained that Karma was faster, and they were right.

- **Chrome moved the goalposts.** Recent Chrome versions blocked `localhost` access from a remote URL. The common workaround is to disable browser security: not scalable, not safe, and it erodes trust in the tool.

Three options existed: keep patching (unsustainable), onboard a second maintainer (impossible as the code was too brittle to hand over), or rebuild with guardrails. Worth the bet: a few months of work to save thousands of hours downstream and, just as importantly, to produce something *someone else could maintain*.

Version 6 is a complete rewrite in TypeScript, organized around three ideas:

1. **Reliability:** a single, structured, queryable trace written by default, so a run tells its own story. No more "turn on logging and try again."
2. **Speed:** one browser, many tabs. Native browser cache. An in-page *agent* that the runner polls, instead of the old probe-then-POST dance. The probe step is simply gone. On complex suites this is roughly 30% faster, and on the OpenUI5 challenge (31K+ tests) a run that took ~15 minutes on version 5 came down to ~6 minutes. Both versions were measured on the same host, across several runs, and the figures averaged.
3. **Maintainability:** clear interfaces, threads instead of processes where it helps, and a documentation system designed to be read by **both** humans and machines.

### Architecture shift

In version 5, the runner spawns a browser per page, and the progress is monitored by having the browser post back information to the runner.

> _Each gray box below is a separate OS process; the runner coordinates them over HTTP and Node.js' IPC communication._

![Version 5 architecture](v5%20architecture.png)

In version 6, only one browser is used and a tab is opened for each page. An agent is injected in the page and it collects progress. The runner queries the agent state to monitor the progress.

> _A single browser process now hosts all tabs; the runner polls each tab's in-page agent over the browser automation framework._

![Version 6 architecture](v6%20architecture.png)

### Quality metrics

The quality metrics back the feeling, measured with [sabik](https://www.npmjs.com/package/sabik):

| |version 5|version 6|
|-|--|--|
|Language|JavaScript|TypeScript|
|[Cognitive complexity](https://www.sonarsource.com/docs/CognitiveComplexity.pdf) (average)|6.72|3.85|
|[Cyclomatic complexity](https://en.wikipedia.org/wiki/Cyclomatic_complexity)|4.19|3.2|
|[Maintainability](https://docs.microsoft.com/en-us/visualstudio/code-quality/code-metrics-maintainability-index-range-and-meaning?view=vs-2019)|82.58|84.64|
|[Bugs delivered](https://en.wikipedia.org/wiki/Halstead_complexity_measures) per 1000 lines (1️⃣)|54.26|39.43|
|Lines of code|11605|10762|

_1️⃣: The Halstead metric estimates the number of bugs latent in the codebase, here expressed per 1,000 lines of code. On average, software projects tend to experience between 15 and 50 bugs per 1,000 lines._

Fewer lines, far less complexity, and the "start option conflict" category of bug simply can't happen anymore, because the type system refuses it at design time. The maintainability index barely moved (82.58 → 84.64) because it was already healthy; the real win was in the complexity figures.

## Built with AI but guardrailed

Eyebrows may go up here, so here is an honest account of what worked and what didn't.

AI came into the picture after the initial architecture was already in place: a cohesive file layout, a platform abstraction layer to enforce testability, and a unified logging framework. The constraints were set before the assistant touched a line of production code.

AI was genuinely excellent at the things that are tedious but low-risk:
- scaffolding UI components from a text wireframe (see [HTML report viewer](https://github.com/ArnaudBuchholz/ui5-test-runner/blob/main/docs/prompts/HTML%20report%20viewer.md))
- converting the [CTRF report](https://ctrf.io/) into other formats
- writing the first draft of a test
- ...

That saved real weeks.

It was dangerous on the things that matter most. An early pass at the browser-spawning and lifecycle logic produced output that looked plausible, clean, confident, and well-named but contained subtle race conditions that would have been a nightmare to diagnose in the field. That's the trap with a capable model: it can be confidently wrong.

The fix was to push back and define the contract first. For the browser drivers, that meant specifying an interface ([IBrowser](https://github.com/ArnaudBuchholz/ui5-test-runner/blob/main/src/browsers/IBrowser.ts)) and a [contract test suite](https://github.com/ArnaudBuchholz/ui5-test-runner/blob/main/src/browsers/browser.test.ts) that every driver must pass, then asking AI to implement each driver **without touching those tests**. The tests became the specification the assistant couldn't rewrite away.

The lesson: **AI doesn't need more freedom, it needs better constraints.**

Linting, test coverage gates, and type checking were the first line of defense: the same quality bar any agile team already enforces.

But the most effective constraint turned out to be **Architecture Decision Records**.

An ADR is a short document capturing one decision: the context, the choice, and the consequences. [Fourteen of them](../adr/index.md) cover the load-bearing parts of the system: the platform abstraction layer, the parallel browser agents, configuration validation, logging and tracing, graceful shutdown, and so on. Each one states not just *what* the architecture is but *why*, including the constraints that are easy to violate by accident.

The index also maps each source file to the ADR it falls under, so there is no guesswork about which decision governs a change.

Three things changed once the ADRs existed:

- **The AI stopped reinventing decisions.** When asked to touch `src/configuration/`, it reads [ADR-0003 Configuration Validation Strategy](https://github.com/ArnaudBuchholz/ui5-test-runner/blob/main/docs/adr/0003-configuration-validation-strategy.md) and follows the multi-stage validation model already in place, instead of inventing a new one. The project's `CLAUDE.md` points every session at the ADR index automatically.

- **There is something concrete to review against.** Reviewing a diff in isolation, the only question is "does this look right?" Reviewing against a written decision, the question becomes "does this honor the decision we made?" That is a sharper question, and it catches the plausible-looking mistakes before they land.

- **The documents keep each other honest.** ADRs are reviewed *alongside* the documentation, not as an afterthought. A `/doc-review` routine checks each doc file against the actual source, looking for contradictions: an option the doc mentions that no longer exists, a default value that has drifted, a behaviour the doc asserts that the code no longer exhibits. It is not a linter: it cannot catch a gap (something the code does that the doc never mentions), only a conflict. But conflicts are the dangerous kind: a gap leaves a user uninformed, a conflict actively misleads them. Running it on every PR that touches `src/` or `docs/` catches the most common drift before it compounds.

Another [behavior rule](https://github.com/ArnaudBuchholz/ui5-test-runner/blob/main/AGENT_BEHAVIOR.md#5-defend-only-against-reachable-states) that provided value: *defend only against reachable states*. If the model proposes a null-check or a retry, it must be able to name a concrete, reachable path that triggers it. Otherwise that "defensive" branch is dead complexity hiding the real failure modes. And the workflow bias is tests-first: "fix the bug" becomes "write a failing test that reproduces it, then make it pass."

The division of labor that emerged: **AI writes the UIs, the boilerplate, the format converters, and the first draft of tests. The critical paths (browser lifecycle, state management) are designed via an ADR and kept under tight review. Everything gets a human review against a written decision.** Go fast on what's safe, go slow on what's risky.

For quality engineers specifically, a few patterns translated directly:

- **Push back and challenge.** AI outputs are hypotheses, not answers. Challenging a result either surfaces an error or produces a better explanation: **both** are useful.
- **Anchor AI to existing test cases.** Migrated end-to-end tests from version 5 served as a concrete specification: the implementation was correct when those tests passed. An AI that cannot break your test suite is an AI operating within the quality gate.
- **Design observability for AI consumption.** Traces were designed from the start to be readable by an assistant. When an error occurred, the first step was to ask AI to troubleshoot from the trace. If the assistant couldn't reach a diagnosis, the trace was reworked, not the query. That feedback loop steadily raised trace quality.

## How do you test an LLM?

Classic testing works on a binary assertion: given this input, expect that output. LLM output breaks that contract. The answer is natural language, it's slightly different every time, and "correct" is a matter of whether the model reached the right conclusion, not whether it matched a string. Building version 6 surfaced exactly this problem, and solving it became its own quality engineering exercise.

The trigger was documentation. Version 6 is a complete rewrite with major breaking changes, and in the AI era users don't *read* migration guides… they ask an assistant. The documentation still has to exist and be correct, but it also has to be *reachable* by the tools people now use to answer their questions. Simply pointing an assistant at the `docs/` folder on GitHub and hoping wasn't an option.

Version 6 is actually **built** documentation-first. Options are *designed* as markdown with frontmatter (keywords, relations between topics) before any code is written. The [`--start` option](https://github.com/ArnaudBuchholz/ui5-test-runner/blob/main/docs/options/start.md) is a good example. There is even an `/add-option` skill that enforces this: you write the doc, then regenerate the option definitions from it, never the other way around. That gives the documentation a real structure, not just prose.

Then that structure is exposed over the **Model Context Protocol**. Running `ui5-test-runner --mcp` starts a small web server offering exactly two tools:

1. `list_topics` returns the *structure* of the knowledge base, meaning all topics with their frontmatter information as a JSON. For instance:

```json
[
    {
        "id": "browser_selection",
        "#type": "concept",
        "title": "Browser Selection Design",
        "summary": "How --driver and --browser separate the automation library from the launched browser, and which combinations are valid",
        "keywords": [
            "browser",
            "driver",
            "puppeteer",
            "playwright",
            "browser_selection",
            "automation"
        ],
        "relations": {
            "requires": [
                "options/driver",
                "options/browser"
            ],
            "see-also": [
                "options/browserOptions",
                "browsers/v6/browser"
            ]
        }
    },
```

2. `get_topic` returns the *content* of a topic (stripping the frontmatter).

Plus a set of [instructions](https://github.com/ArnaudBuchholz/ui5-test-runner/blob/b5a5cc74eb5c4b9f95cf2d0f35cfc0d1b36ad977/src/modes/mcp/reserve.ts#L20) that tell the MCP client to treat this documentation as **authoritative**. That last word matters: it's the difference between an assistant guessing from its training data and an assistant answering from the **current, correct** documentation.

The quality question that follows: **how do you know the documentation actually works?** Not "is the markdown valid" but rather does an assistant, given a realistic question and this knowledge base, arrive at a correct answer? That's not a conventional assertion. The output is natural language, and it's slightly different every time.

The approach that emerged is an LLM-as-judge harness. Each test case is a small `config.toml` describing a scenario:

```toml
[user]
question = "How do I migrate to ui5-test-runner 6?"

[files]
"package.json" = """{ "devDependencies": { "ui5-test-runner": "^5" } }"""
"ui5-test-runner.json" = """{ "reportGenerator": ["$/report.js"] }"""

[expected]
v6 = "It should explain how to migrate the project to version 6"
config = "it should explain that reportGenerator is no longer supported"
```

Three parts:
- the `[user]` question,
- a `[files]` block simulating the project's file system so the scenario is concrete,
- and `[expected]` the criteria a good answer must satisfy, written in plain language.

Two harnesses collaborate to do the work:

- The **query** harness connects to the live MCP server and lets the model answer the question, exactly as a real assistant would. A deliberately weak model is used here: if even a model with little reasoning headroom reaches the right answer, the documentation is doing the work rather than the model's own cleverness.

- The **judge** harness takes that answer and scores it against each expected criterion, emitting a per-criterion verdict and a report. The thing being validated isn't a string. It's whether the documentation, as exposed, is *enough* for a model to reach the right conclusion. The judge is instructed to be a [strict, literal evaluator](https://github.com/ArnaudBuchholz/ui5-test-runner/blob/b5a5cc74eb5c4b9f95cf2d0f35cfc0d1b36ad977/test/mcp/judge.ts#L20): a criterion passes only if the answer actually contains what it asks for, so a case can genuinely fail rather than being waved through.

One thing worth naming: the judge is itself a model, so it inherits the same noise property as the query. A single judge verdict can be wrong in either direction: a genuine gap scored as a pass, or a correct answer penalised for phrasing. Repeating the full cycle (query + judge) five times means you're not just averaging out the query's variance; you're averaging out the judge's too. The pass rate you measure is the pass rate of the whole pipeline, end to end.

The last piece is what kept this from being flaky. LLM answers are noisy; a single run tells you very little. So the harness supports repetition:

```
ui5-test-runner --mcp --watch     # keep the docs server live while iterating
npm run test:mcp --repeat 5       # run each case five times
```

Running each case five times turns a brittle pass/fail into a **pass rate**, and the pass rate is diagnostic in a way a single verdict never is:
- Zero out of five means a genuine gap in the documentation. The model couldn't get there no matter what.
- A mixed result (say three of five) means the content is *present but not reliably findable*. Maybe the topic needs a sharper keyword or an explicit cross-reference.

The working rule is set to **fix the cases that fail more than once.** That filters out one-off noise and points directly at the docs that need work. The fix is usually small: add a keyword to the frontmatter, drop an explicit cross-reference, or rewrite a summary so the question maps to it. Then re-run with `--repeat 5` to confirm the pass rate recovers. This feedback loop runs automated in an agent.

That closes the loop between "write documentation" and "prove it answers the question."

## Takeaways

Here are my takeaways, compressed into a few lines for the next person maintaining something at scale:

- **The goal was sustainability, and the refactor only served it.** TypeScript, the trace system, the tab-based browser model: those are means. The end was a tool someone else could confidently change.
- **Give AI constraints, not freedom.** It's brilliant at scaffolding and boilerplate, and genuinely risky in the orchestration-heavy critical paths. ADRs were the single best lever: they stopped it reinventing decisions and provided something concrete to review its output *against*.
- **Document for the AI, not just for humans** then expose those docs over MCP and make them authoritative.
- **Let an LLM judge prove the docs work, and repeat the test to separate a real gap from noise.** A pass rate tells you more than a verdict.

Version 6 is out. Come kick the tires and, as always, send feedback. For a tool a hundred teams depend on, that feedback loop is the whole point.
