'use strict'

const { parseArgs } = require('node:util')
const assert = require('node:assert/strict')
const { readFile, stat } = require('node:fs/promises')
const { join } = require('node:path')
const { resolvePackage } = require('../../src/npm')

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

  const hasReport = job.reportGenerator.some(generator => generator.match(/src[/\\]defaults[/\\]report\.js$/))
  if (hasReport) {
    const jsdomPath = await resolvePackage(null, 'jsdom')
    const jsdom = require(jsdomPath)
    const { JSDOM, VirtualConsole } = jsdom
    const reportHtmlPath = join(job.reportDir, 'report.html')
    const reportHtml = await readFile(reportHtmlPath, 'utf8')
    const virtualConsole = new VirtualConsole()
    const errors = []
    virtualConsole.on('error', (error) => {
      errors.push(error)
    })
    virtualConsole.on('jsdomError', (error) => {
      errors.push(error)
    })
    const dom = new JSDOM(reportHtml, { runScripts: 'dangerously', virtualConsole })
    if (errors.length > 0) {
      assert.fail(`Errors in report.html: ${errors.join('\n')}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 100)) // Wait for the report to be updated
    assert.strictEqual(dom.window.document.querySelector('h1').textContent, 'Test report', 'Report title is correct')
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
