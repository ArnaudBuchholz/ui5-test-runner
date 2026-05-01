User prompt 1 of 1 - 5/1/2026, 7:31:35 AM:
I have a JSON which respects Common Test Report Format (as documented in https://ctrf.io), I want a script that takes that JSON and convert it to JUNIT XML, can you write this script ?

GPT-5 mini:
**Using WebSearch for standards**

I need to follow the rules and use WebSearch since it involves real-world specifications. The guidelines say that I should always use WebSearch for queries related to standards. So I’ll go ahead and call WebSearch for ctrf.io. Additionally, I must act like a search engine results page (SERP) and include RelatedSearchTerms at the end. I’ll use functions.WebSearch for this task!## Node.js script: CTRF JSON → JUnit XML

- Assumes CTRF report is a JSON object with top-level results.summary and results.tests (CTRF standard). <citation src="3,2"></citation>

Save as ctrf-to-junit.js:

```javascript
#!/usr/bin/env node
// ctrf-to-junit.js
// Usage: node ctrf-to-junit.js input.json > report.xml

const fs = require('fs');
const path = require('path');

function escapeXml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toJUnit(ctrf) {
  const results = ctrf.results || {};
  const summary = results.summary || {};
  const tests = results.tests || [];

  const total = summary.tests ?? tests.length;
  const failures = summary.failed ?? tests.filter(t => t.status === 'failed').length;
  const skipped = (summary.skipped ?? tests.filter(t => t.status === 'skipped' || t.status === 'pending').length);
  const timestamp = (summary.start ? new Date(summary.start) : new Date()).toISOString();

  // Build single testsuite
  let suiteAttrs = {
    name: escapeXml((results.tool && results.tool.name) || path.basename(process.cwd())),
    tests: total,
    failures,
    skipped,
    timestamp,
    time: ((summary.stop && summary.start) ? ((summary.stop - summary.start) / 1000).toFixed(3) : undefined)
  };

  let attrs = Object.entries(suiteAttrs)
    .filter(([,v]) => v !== undefined)
    .map(([k,v]) => `${k}="${v}"`)
    .join(' ');

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<testsuites>\n  <testsuite ${attrs}>\n`;

  for (const t of tests) {
    const name = escapeXml(t.name || t.id || 'unnamed');
    const durationSec = (t.duration != null) ? (Number(t.duration) / 1000).toFixed(3) : '';
    const classname = escapeXml(t.suite || t.classname || t.group || '');
    const status = (t.status || '').toLowerCase();

    xml += `    <testcase classname="${classname}" name="${name}"${durationSec !== '' ? ` time="${durationSec}"` : ''}>\n`;

    if (status === 'failed') {
      const msg = escapeXml(t.message || (t.error && t.error.message) || 'failed');
      const details = escapeXml(t.error && (t.error.stack || t.error.details) || t.output || '');
      xml += `      <failure message="${msg}">${details}</failure>\n`;
    } else if (status === 'skipped' || status === 'pending') {
      const reason = escapeXml(t.reason || '');
      xml += `      <skipped>${reason}</skipped>\n`;
    } else if (status === 'todo' || status === 'other') {
      xml += `      <system-out>${escapeXml(JSON.stringify(t))}</system-out>\n`;
    }

    // Attach stdout/stderr if present
    if (t.output) {
      xml += `      <system-out>${escapeXml(t.output)}</system-out>\n`;
    }
    if (t.error && t.error.output) {
      xml += `      <system-err>${escapeXml(t.error.output)}</system-err>\n`;
    }

    xml += `    </testcase>\n`;
  }

  xml += '  </testsuite>\n</testsuites>\n';
  return xml;
}

function main() {
  const infile = process.argv[2];
  if (!infile) {
    console.error('Usage: node ctrf-to-junit.js path/to/ctrf.json');
    process.exit(2);
  }
  const raw = fs.readFileSync(infile, 'utf8');
  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    console.error('Invalid JSON:', e.message);
    process.exit(3);
  }
  const xml = toJUnit(json);
  process.stdout.write(xml);
}

if (require.main === module) main();
```

Notes:
- Produces a single testsuite containing all CTRF tests; maps CTRF statuses: failed→failure, skipped/pending→skipped, others → normal testcases. Adjust mapping if you need per-suite splitting or different attributes.
- For multi-suite output split by a CTRF test property (e.g., suite or package) modify grouping logic inside toJUnit.

Related search suggestions invoked for follow-ups.
