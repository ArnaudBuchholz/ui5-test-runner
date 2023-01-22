'use strict'

const { join } = require('path')
const { readFile, writeFile } = require('fs').promises
const [,, reportDir] = process.argv

const defaultDir = join(__dirname, 'report')

async function readDefault (name) {
  return (await readFile(join(defaultDir, name))).toString()
}

async function readDependency (name) {
  return (await readFile(join(__dirname, '../../node_modules', name, 'dist', `${name}.js`))).toString()
}

async function main () {
  const html = await readDefault('default.html')
  const styles = (await readDefault('styles.css'))
    .replace(/\{\r?\n\s+/g, '{')
    .replace(/\}(\r?\n)+/g, '} ')
    .replace(/;\r?\n/g, ';')

  const punyexpr = await readDependency('punyexpr')
  const punybind = await readDependency('punybind')
  const common = await readDefault('common.js')
  const main = await readDefault('main.js')

  const job = (await readFile(join(reportDir, 'job.js'))).toString()
    .replace(/(\{|,|\[)\r?\n\s+/g, (_, c) => c)
    .replace(/\r?\n\s+(\}|\])/g, (_, c) => c)
    .replace(/": "/g, '":"')

  return await writeFile(join(reportDir, 'report.html'), html
    .replace('<link rel="stylesheet" href="/_/report/styles.css">', `<style>${styles}</style>`)
    .replace('<script src="/_/punyexpr.js"></script>', `<script>${punyexpr}</script>`)
    .replace('<script src="/_/punybind.js"></script>', `<script>${punybind}</script>`)
    .replace('<script src="/_/report/common.js"></script>', `<script>${common}</script>`)
    .replace('<script src="/_/report/main.js"></script>', `<script>const module = {}
${job}
const job = module.exports
${main}
</script>`)
  )
}

main()
  .catch(reason => {
    console.error(reason)
    return -1
  })
  .then((code = 0) => {
    process.exit(code)
  })
