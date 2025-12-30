'use strict'

const { join, isAbsolute } = require('path')
const { writeFile } = require('fs').promises
const [,, reportDir] = process.argv
const verbose = process.argv.includes('--verbose')

const log = verbose ? console.log : () => {}

log('🏗 Building JSON report...')

async function main () {
  const jobPath = isAbsolute(reportDir) ? reportDir : join(process.cwd(), reportDir)
  log('📦 job path        :', jobPath)
  const rawJob = require(join(jobPath, 'job.js'))
  const cleanJob = JSON.parse(JSON.stringify(rawJob, (key, value) => {
    if (value && value instanceof RegExp) {
      return value.toString()
    }
    return value
  }))
  const json = JSON.stringify(cleanJob, null, 2)
  log('📦 json            :', json.length)

  await writeFile(join(reportDir, 'report.json'), json)
  log('✅ generated.')
}

main()
  .catch(reason => {
    console.error(reason)
    return -1
  })
  .then((code = 0) => {
    process.exit(code)
  })
