'use strict'

const { join, isAbsolute } = require('path')
const { readFile, writeFile } = require('fs').promises
const zlib = require('zlib')
const [,, reportDir] = process.argv
const verbose = process.argv.includes('--verbose')
const { resolveDependencyPath } = require('../npm.js')

const log = verbose ? console.log : () => {}

log('🏗 Building report...')

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
  log('📦 default.html    :', html.length)
  const styles = (await readDefault('styles.css'))
    .replace(/\{\r?\n\s+/g, '{')
    .replace(/\}(\r?\n)+/g, '} ')
    .replace(/;\r?\n\s*/g, ';')
    .replace(/(:|,)\s*/g, (_, c) => c)
  log('📦 styles.css      :', styles.length)

  const punyexpr = await readDependency('punyexpr')
  log('📦 punyexpr        :', punyexpr.length)
  const punybind = await readDependency('punybind')
  log('📦 punybind        :', punybind.length)
  const common = minifyJs(await readDefault('common.js'))
  log('📦 common          :', common.length)
  const main = minifyJs(await readDefault('main.js'))
  log('📦 main            :', main.length)

  const decompress = minifyJs(await readDefault('decompress.js'))
  log('📦 decompress      :', decompress.length)
  const jobPath = isAbsolute(reportDir) ? reportDir : join(process.cwd(), reportDir)
  log('📦 job path        :', jobPath)
  const rawJob = require(join(jobPath, 'job.js'))
  const json = JSON.stringify(rawJob)
  log('📦 json            :', json.length)
  const buffer = zlib.gzipSync(json)
  const base64 = buffer.toString('base64')
  log('📦 json (Gzip/b64) :', base64.length)
  log('📦 compression     :', (100 * base64.length / json.length).toFixed(2) + '%')

  await writeFile(join(reportDir, 'report.html'), html
    .replace(/(>|\}\})\r?\n\s*</g, (_, c) => `${c}<`)
    .replace('<link rel="stylesheet" href="/_/report/styles.css">', `<style>${styles}</style>`)
    .replace('<script src="/_/punyexpr.js"></script>', `<script>${punyexpr}</script>`)
    .replace('<script src="/_/punybind.js"></script>', `<script>${punybind}</script>`)
    .replace('<script src="/_/report/common.js"></script>', `<script>${common}</script>`)
    .replace('<script src="/_/report/main.js"></script>', `<script>const module={};${decompress};let job={};decompress("${base64}").then(json=>{job=json});${main}</script>`)
  )
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
