'use strict'

const { parseArgs } = require('node:util')
const assert = require('node:assert/strict')
const { readFile, stat } = require('node:fs/promises')
const { join } = require('node:path')

const {
  values: {
    pages,
    coverage,
    'report-uncovered': coverageReportUncovered,
    'junit-xml-report': junitXmlReport,
    failed
  },
  positionals
} = parseArgs({
  allowPositionals: true,
  options: {
    'pages': {
      type: 'string',
      default: ''
    },
    coverage: {
      type: 'boolean',
      default: false
    },
    'report-uncovered': {
      type: 'boolean',
      default: false
    },
    'junit-xml-report': {
      type: 'boolean',
      default: false
    },
    failed: {
      type: 'boolean',
      default: false
    }
  }
})

async function main () {
  const reportDir = positionals[0]
  assert.ok(reportDir, 'Report directory must be provided as a positional argument')
  const jobPath = join(reportDir, 'report.json')
  let jobContent
  try {
    jobContent = await readFile(jobPath, 'utf8')
  } catch (e) {
    assert.fail(`Failed to read report file at '${jobPath}': ${e.message}`)
  }
  let job
  try {
    job = JSON.parse(jobContent)
  } catch (e) {
    assert.fail(`Failed to parse report file at '${jobPath}' as JSON: ${e.message}`)
  }

  assert.strictEqual(job.reportFormat, 'CTRF', 'report.json has CTRF format')
  assert.ok(job.results?.summary, 'report.json has results.summary')
  assert.ok(Array.isArray(job.results?.tests), 'report.json has results.tests array')

  if (failed) {
    assert.ok(job.results.summary.failed > 0, 'Job failed')
  } else {
    assert.strictEqual(job.results.summary.failed, 0, 'Job succeeded')
  }

  if (pages) {
    const expectedCount = parseInt(pages)
    const pageUrls = new Set(job.results.tests.flatMap(test => (test.suite ?? []).filter(s => s.startsWith('http'))))
    assert.strictEqual(pageUrls.size, expectedCount, 'Number of test pages')
  }

  if (coverage) {
    const { coverageTempDir, coverageReportDir } = job
    const mergedCoveragePath = join(coverageTempDir, 'merged/coverage.json')
    assert.strictEqual((await stat(mergedCoveragePath)).isFile(), true, 'Merged coverage file exists')
    const mergedCoverage = JSON.parse((await readFile(mergedCoveragePath)).toString())
    assert.ok(Object.keys(mergedCoverage).every(key => {
      const { path } = mergedCoverage[key]
      return path === key
    }), 'Merged coverage file contains only absolute paths (key === path)')
    assert.strictEqual((await stat(coverageReportDir)).isDirectory(), true, 'Coverage folder exists')
    assert.strictEqual((await stat(join(coverageReportDir, 'lcov-report/index.html'))).isFile(), true, 'Coverage HTML report exists')
    const lcov = (await readFile(join(coverageReportDir, 'lcov.info'))).toString()
    assert.ok(lcov.length > 0, 'lcov data exists')
    if (coverageReportUncovered) {
      assert.ok(lcov.match(/\bcontroller(\/|\\)uncovered\.(js|ts)\b/), 'uncovered is reported')
    }
  }

  if (junitXmlReport) {
    assert.strictEqual((await stat(join(job.reportDir, 'junit.xml'))).isFile(), true, 'junit XML report exists')
  }
}

main().catch(reason => {
  console.error(reason)
  process.exit(-1)
})
