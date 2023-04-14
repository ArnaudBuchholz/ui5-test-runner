'use strict'

const { join } = require('path')
const { readFile, writeFile } = require('fs').promises
const [,, reportDir] = process.argv
const { resolveDependencyPath } = require('../npm.js')

const defaultDir = join(__dirname, 'report')

async function readDefault (name) {
  return (await readFile(join(defaultDir, name))).toString()
}

async function readDependency (name) {
  const path = join(resolveDependencyPath(name), `dist/${name}.js`)
  return (await readFile(path)).toString()
}

function minifyJs (src) {
  return src
    .replace(/\/\*.*\*\//g, '')
    .replace(/\{\r?\n\s*/g, '{')
    .replace(/\r?\n\s*\}/g, '}')
    .replace(/,?\r?\n\s*\.?/g, match => {
      let result = ''
      if (match.startsWith(',')) {
        result = ','
      }
      if (match.endsWith('.')) {
        result += '.'
      }
      return result || ';'
    })
}

async function main () {
  const html = await readDefault('default.html')
  const styles = (await readDefault('styles.css'))
    .replace(/\{\r?\n\s+/g, '{')
    .replace(/\}(\r?\n)+/g, '} ')
    .replace(/;\r?\n\s*/g, ';')
    .replace(/(:|,)\s*/g, (_, c) => c)

  const punyexpr = await readDependency('punyexpr')
  const punybind = await readDependency('punybind')
  const common = minifyJs(await readDefault('common.js'))
  const main = minifyJs(await readDefault('main.js'))

  const job = (await readFile(join(reportDir, 'job.js'))).toString()
    .replace(/(\{|,|\[)\r?\n\s*/g, (_, c) => c)
    .replace(/\r?\n\s*(\}|\])/g, (_, c) => c)
    .replace(/": "/g, '":"')

  return await writeFile(join(reportDir, 'report.html'), html
    .replace(/(>|\}\})\r?\n\s*</g, (_, c) => `${c}<`)
    .replace('<link rel="stylesheet" href="/_/report/styles.css">', `<style>${styles}</style>`)
    .replace('<script src="/_/punyexpr.js"></script>', `<script>${punyexpr}</script>`)
    .replace('<script src="/_/punybind.js"></script>', `<script>${punybind}</script>`)
    .replace('<script src="/_/report/common.js"></script>', `<script>${common}</script>`)
    .replace('<script src="/_/report/main.js"></script>', `<script>const module={};${job};const job=module.exports;${main}</script>`)
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
