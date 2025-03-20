'use strict'

const { parseArgs } = require('node:util')
const assert = require('node:assert/strict')
const { readFile, stat } = require('node:fs/promises')
const { join } = require('node:path')

const {
  values: {
    'qunit-pages': qunitPages,
    coverage,
    'report-uncovered': coverageReportUncovered,
    'junit-xml-report': junitXmlReport,
    failed
  },
  positionals
} = parseArgs({
  allowPositionals: true,
  options: {
    'qunit-pages': {
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
  const job = require(positionals[0])

  if (failed) {
    assert.strictEqual(job.failed, true, 'Job failed')
  } else {
    assert.strictEqual(job.failed, false, 'Job succeeded')
  }

  if (qunitPages) {
    assert.notStrictEqual(job.qunitPages, undefined, 'Pages found')
    const expectedCount = parseInt(qunitPages)
    assert.strictEqual(Object.keys(job.qunitPages).length, expectedCount, 'Number of test pages')
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
