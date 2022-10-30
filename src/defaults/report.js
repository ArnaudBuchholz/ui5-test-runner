'use strict'

const { join } = require('path')
const { copyFile } = require('fs').promises
const [,, reportDir] = process.argv

async function main () {
  await copyFile(join(__dirname, 'report.html'), join(reportDir, 'report.html'))
}

main()
  .catch(reason => {
    console.error(reason)
    return -1
  })
  .then((code = 0) => {
    process.exit(code)
  })
