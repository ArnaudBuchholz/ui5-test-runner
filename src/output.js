'use strict'

const nativeConsole = console
const mockConsole = {}
const { columns } = process.stdout
const interactive = columns !== undefined
let lastTick = 0
const ticks = ['\u280b', '\u2819', '\u2839', '\u2838', '\u283c', '\u2834', '\u2826', '\u2827', '\u2807', '\u280f']
let job
let lines = 1

function write (...parts) {
  parts.forEach(part => process.stdout.write(part))
}

function clean () {
  write(`\x1b[${lines.toString()}F`, ''.padEnd(columns, '\u2591'), '\x1b[1G')
}

const width = 10

function bar (ratio, msg) {
  write('[')
  if (typeof ratio === 'string') {
    if (ratio.length > width) {
      write(ratio.substring(0, width - 3), '...')
    } else {
      const padded = ratio.padStart(width - Math.floor((width - ratio.length) / 2), '-').padEnd(width, '-')
      write(padded)
    }
  } else {
    const filled = Math.floor(width * ratio)
    write(''.padEnd(filled, '\u2588'), ''.padEnd(width - filled, '\u2591'))
  }
  write('] ', msg, '\n')
}

function progress (cleanFirst = true) {
  if (cleanFirst) {
    clean()
  }
  lines = 1
  if (job.testPageUrls && job.testPages && job.parallel > 0) {
    const total = job.testPageUrls.length
    const done = Object.keys(job.testPages)
      .filter(pageUrl => !!job.testPages[pageUrl].report)
      .length
    if (done < total) {
      lines += 1
      bar(done / total, 'Overall progress')
    }
  }
  if (job.browsers) {
    const runningPages = Object.keys(job.browsers)
    lines += runningPages.length
    runningPages.forEach(pageUrl => {
      let starting = true
      if (job.testPages) {
        const page = job.testPages[pageUrl]
        if (page) {
          const { total, passed, failed } = page
          if (total) {
            const progress = passed + failed
            bar(progress / total, pageUrl)
            starting = false
          }
        }
      }
      if (starting) {
        bar('starting', pageUrl)
      }
    })
  }
  write(ticks[++lastTick % ticks.length], ' ', job.status, '\n')
}

Object.getOwnPropertyNames(console).forEach(name => {
  mockConsole[name] = function (...args) {
    if (job) {
      clean()
    }
    nativeConsole[name](...args)
    if (job) {
      progress(false)
    }
  }
})

if (interactive) {
  global.console = mockConsole
}

module.exports = {
  monitor (newJob) {
    job = newJob
    if (interactive) {
      process.stdout.write('\n')
      setInterval(progress, 250)
    }
  }
}
