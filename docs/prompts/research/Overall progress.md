# Computing valid overall progress

The project uses TypeScript.

During tests executions, information on the progress of the execution is being dispatched using log traces.

```ts
export type OverallProgressData = {
  uid: '';
  /** Pages executed */
  value: number;
  /** Total number of pages */
  max: number;
};

export type PageProgressData = {
  uid: string;
  /** Tests executed */
  value: number;
  /** Total number of tests */
  max: number;
  /** Errors */
  errors: number;
  type: 'unknown' | 'qunit' | 'opa';
  remove?: true;
};
```

We have two kind of events :
- `OverallProgressData` indicating the known number of pages and how many were already executed. Note that the total number of pages may grow while executing.
- `PageProgressData` indicating, for the pages *being* executed, the total number of tests (which may evolve over time), and the current number of executed tests.

I would like to improve the `OverallProgressData` structure to contain the following members :
- `totalNumberOfExecutedTests`
- `totalNumberOfErrors`
- `totalNumberOfTests`

The problems are :
- Pages are executed in parallel
- Until a page is completed, the numbers of `PageProgressData` evolve over time.
- I want to consolidate the `OverallProgressData` numbers every time a `PageProgressData` event is received but I can't simply "add" the numbers because they evolve over time

Can you help me design the algorithm to have the `OverallProgressData` numbers be up to date ?

Bonus question : How can I estimate the remaining execution time ?

# Answer (GPT-5 mini)

Summary algorithm (decisive, recompute-on-update)

Keep a map of the latest PageProgressData snapshots keyed by uid and recompute totals from that map whenever you receive any page event. Do not try to accumulate deltas — pages change over time and only the current snapshot is authoritative.

Behavior rules
- On any PageProgressData event:
  - Update the map entry for that uid with the new snapshot (replace previous).
  - If event.remove === true treat the snapshot as the final snapshot and keep it in the map (do not delete it).
- On any OverallProgressData event:
  - Use its max to update your overall pages total, but still compute test/error totals from the page map.
- To produce OverallProgressData totals, compute aggregates by summing the current map entries.

Why this works
- Recomputing from current snapshots avoids double-counting when page values increase.
- Keeping a final snapshot for finished pages preserves totals after pages stop emitting.
- The overall page count (max) can still increase independently; you just reflect the latest max.

TypeScript pseudocode
```ts
type Overall = {
  uid: string;
  value: number;
  max: number; // pages known
  totalNumberOfExecutedTests: number;
  totalNumberOfErrors: number;
  totalNumberOfTests: number;
};

const pages = new Map<string, PageProgressData>();

function onPageEvent(p: PageProgressData) {
  // store latest snapshot (final if remove===true)
  pages.set(p.uid, { ...p });

  // recompute aggregates
  const totals = { executed: 0, errors: 0, tests: 0 };
  for (const snap of pages.values()) {
    totals.executed += snap.value;
    totals.errors += snap.errors;
    totals.tests += snap.max;
  }

  // emit or update overall progress using last-known overall.pages info (max/value)
  const overall: Overall = {
    uid: 'overall',
    value: /* last known overall.value or recompute from finished pages if you want */,
    max: /* last known overall.max (updated on Overall events) */,
    totalNumberOfExecutedTests: totals.executed,
    totalNumberOfErrors: totals.errors,
    totalNumberOfTests: totals.tests,
  };

  publishOverall(overall);
}

function onOverallEvent(o: OverallProgressData) {
  // update last-known page counts (value/max) and recompute aggregates from pages map as above
  lastOverallPageValue = o.value;
  lastOverallPageMax = o.max;
  // then recompute totals the same way (or call onPageEvent handler logic)
}
```

Notes / edge cases
- If a page hasn't emitted yet, it won't be in the map and its tests won't contribute to totals; that matches reality (unknown).
- If a page later increases its max, your recompute will reflect that immediately.
- Do not delete a page entry when it finishes unless you take a final snapshot elsewhere; deleting would drop its contribution.
- If you want to support memory cleanup, keep finished snapshots in a compact final form (no further updates) and only garbage-collect after overall run completion.

Bonus — estimating remaining time (ETA)
1. Metric to measure: global throughput = testsExecuted / time (tests per second).
2. Maintain a short sliding window of recent (timestamp, totalExecutedTests) samples (e.g., last 10–30 seconds).
3. Compute instantaneous throughput as slope over the window: rate = (latestExecuted - oldestExecuted) / (latestTime - oldestTime).
4. Remaining tests = estimatedTotalTests - latestExecuted.
   - If some pages' max are still growing, use current observed max as the conservative estimate; optionally add an estimated growth margin (e.g., +X%) if you see max increasing historically.
5. ETA seconds = remainingTests / max(rate, epsilon). Convert to human format.

Simple pseudocode for ETA
```ts
type Sample = { t: number; executed: number };
const samples: Sample[] = [];

function addSample(now: number, executed: number) {
  samples.push({ t: now, executed });
  // drop old samples to keep window size or time span
  while (samples.length > 30) samples.shift();
}

function estimateRate() {
  if (samples.length < 2) return null;
  const first = samples[0], last = samples[samples.length-1];
  const dt = (last.t - first.t) / 1000; // seconds
  if (dt <= 0) return null;
  return (last.executed - first.executed) / dt; // tests/sec
}

function estimateETA(totalTests: number, latestExecuted: number) {
  const rate = estimateRate();
  if (!rate || rate <= 1e-6) return null; // unknown or infinite
  const remaining = Math.max(0, totalTests - latestExecuted);
  return remaining / rate; // seconds
}
```

Practical tips
- Use a minimum rate floor to avoid divide-by-zero; show “unknown” if rate is too small.
- Smooth rate with linear regression over samples if noisy.
- If many pages are still growing their max, present ETA as optimistic/pessimistic bounds (e.g., assume no further growth vs. assume observed growth trend continues).
- Report ETA only when you have enough samples (e.g., > 3) to avoid wild estimates.

That algorithm gives correct, non-duplicated aggregates and a practical ETA estimate based on observed throughput.