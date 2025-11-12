'use strict'

// Based on specification from llg[.]cubic[.]org/docs/junit/

const { join } = require('path')
const { writeFile } = require('fs').promises
const [, , reportDir] = process.argv

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
  const urls = Object.keys(job.qunitPages || {})
  for (const url of urls) {
    const qunitPage = job.qunitPages[url] || { modules: [] }
    for (const module of qunitPage.modules) {
      o(`  <testsuite
    name="${xmlEscape(url)}"
    package="${xmlEscape(module.name)}"
    tests="${module.tests.length}"
  >`)
      for (const test of module.tests) {
        let time
        if (test.start && test.end) {
          time = (new Date(test.end) - new Date(test.start)) / 1000
        }
        o(`    <testcase
      name="${xmlEscape(test.name)}"
      classname="${xmlEscape(module.name)}" ${
        time === undefined
        ? ''
        : `
      time="${time}"`
}
    >`)
        if (test.screenshot) {
          o(`<system-out>[[ATTACHMENT|${join(reportDir, qunitPage.id, test.screenshot)}]]</system-out>`)
        }
        if (test.skip) {
          o('      <skipped></skipped>')
        } else if (!test.report) {
          o('      <skipped>(no report found)</skipped>')
        } else if (test.report.failed) {
          test.logs
            .filter(({ result }) => !result)
            .forEach(log => {
              if (log.message) {
                o(`      <failure
        message="${xmlEscape(log.message)}"
      >`)
              } else {
                o('      <failure>')
              }
              if (log.source) {
                o(xmlEscape(log.source))
              }
              o('      </failure>')
            })
        }
        o('    </testcase>')
      }
      o('  </testsuite>')
    }
  }
  o('</testsuites>')
  await writeFile(join(reportDir, process.env.JUNIT_XML_REPORT_FILENAME || 'junit.xml'), output.join('\n'))
}

main()
  .catch(reason => {
    console.error(reason)
    return -1
  })
  .then((code = 0) => {
    process.exit(code)
  })
module.exports = main