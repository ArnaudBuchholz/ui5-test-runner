'use strict'

const { join } = require('path')
const { writeFile } = require('fs').promises
const [,, reportDir] = process.argv

const output = []
function o (text) {
  output.push(text)
}

function xmlEscape (text) {
  return text.replace(/<|>|&|"/g, match => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;'
  }[match]))
}

async function main () {
  const job = require(join(reportDir, 'job.js'))
  o('<?xml version="1.0" encoding="UTF-8"?>')
  o('<testsuites>')
  const urls = Object.keys(job.qunitPages)
  for (const url of urls) {
    const qunitPage = job.qunitPages[url]
    for (const module of qunitPage.modules) {
      o(`  <testsuite
    name="${xmlEscape(url)}"
    package="${xmlEscape(module.name)}"
    tests="${module.tests.length}"
  >`)
      for (const test of module.tests) {
        o(`    <testcase
      name="${xmlEscape(test.name)}"
    >`)
        if (test.skip) {
          o('      <skipped></skipped>')
        } else if (test.report.failed) {
          const log = test.logs.filter(({ result }) => !result)[0]
          o(`      <failure
        message="${xmlEscape(log.message)}"
      >`)
          o(xmlEscape(log.source))
          o('      </failure>')
        }
        o('    </testcase>')
      }
      o('  </testsuite>')
    }
  }
  o('</testsuites>')
  await writeFile(join(reportDir, 'junit.xml'), output.join('\n'))
}

main()
  .catch(reason => {
    console.error(reason)
    return -1
  })
  .then((code = 0) => {
    process.exit(code)
  })
