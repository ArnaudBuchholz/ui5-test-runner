'use strict'

const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')
const { $browsers } = require('./symbols')
const { noop, pad } = require('./tools')

const inJest = typeof jest !== 'undefined'
const interactive = process.stdout.columns !== undefined && !inJest
const $output = Symbol('output')

let cons
if (inJest) {
  cons = {
    log: noop,
    warn: noop,
    error: noop
  }
} else {
  cons = console
}

const write = (...parts) => parts.forEach(part => process.stdout.write(part))

function clean (job) {
  const { lines } = job[$output]
  if (!lines) {
    return
  }
  write(`\x1b[${lines.toString()}F`)
  for (let line = 0; line < lines; ++line) {
    if (line > 1) {
      write('\x1b[1E')
    }
    write(''.padEnd(process.stdout.columns, ' '))
  }
  if (lines > 1) {
    write(`\x1b[${(lines - 1).toString()}F`)
  } else {
    write('\x1b[1G')
  }
}

const BAR_WIDTH = 10

function bar (ratio, msg) {
  write('[')
  if (typeof ratio === 'string') {
    if (ratio.length > BAR_WIDTH) {
      write(ratio.substring(0, BAR_WIDTH - 3), '...')
    } else {
      const padded = ratio.padStart(BAR_WIDTH - Math.floor((BAR_WIDTH - ratio.length) / 2), '-').padEnd(BAR_WIDTH, '-')
      write(padded)
    }
    write(']     ')
  } else {
    const filled = Math.floor(BAR_WIDTH * ratio)
    write(''.padEnd(filled, '\u2588'), ''.padEnd(BAR_WIDTH - filled, '\u2591'))
    const percent = Math.floor(100 * ratio).toString().padStart(3, ' ')
    write('] ', percent, '%')
  }
  write(' ')
  const spaceLeft = process.stdout.columns - BAR_WIDTH - 14
  if (msg.length > spaceLeft) {
    write('...', msg.substring(msg.length - spaceLeft - 3))
  } else {
    write(msg)
  }
  write('\n')
}

const TICKS = ['\u280b', '\u2819', '\u2839', '\u2838', '\u283c', '\u2834', '\u2826', '\u2827', '\u2807', '\u280f']

function progress (job, cleanFirst = true) {
  if (cleanFirst) {
    clean(job)
  }
  const output = job[$output]
  output.lines = 1
  let progressRatio
  if (job.testPageUrls && job.qunitPages && job.parallel > 0) {
    const total = job.testPageUrls.length
    const done = Object.keys(job.qunitPages)
      .filter(pageUrl => !!job.qunitPages[pageUrl].report)
      .length
    if (done < total) {
      progressRatio = done / total
    }
  }
  if (job[$browsers]) {
    const runningPages = Object.keys(job[$browsers])
    output.lines += runningPages.length
    runningPages.forEach(pageUrl => {
      let starting = true
      if (job.qunitPages) {
        const page = job.qunitPages[pageUrl]
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
  const status = `${TICKS[++output.lastTick % TICKS.length]} ${job.status}`
  if (progressRatio !== undefined) {
    bar(progressRatio, status)
  } else {
    write(status, '\n')
  }
}

function output (job, ...texts) {
  writeFileSync(join(job.reportDir, 'output.txt'), texts.map(t => t.toString()).join(' ') + '\n', {
    encoding: 'utf-8',
    flag: 'a'
  })
}

function log (job, ...texts) {
  cons.log(...texts)
  output(job, ...texts)
}

function warn (job, ...texts) {
  cons.warn(...texts)
  output(job, ...texts)
}

function err (job, ...texts) {
  cons.error(...texts)
  output(job, ...texts)
}

const p80 = () => pad(process.stdout.columns || 80)

function browserIssue (job, { type, url, code, dir }) {
  const p = p80()
  log(job, p`┌──────────${pad.x('─')}┐`)
  log(job, p`│ BROWSER ${type.toUpperCase()} ${pad.x(' ')} │`)
  log(job, p`├──────┬─${pad.x('─')}──┤`)
  log(job, p`│ url  │ ${pad.lt(url)} │`)
  log(job, p`├──────┼─${pad.x('─')}──┤`)
  const unsignedCode = new Uint32Array([code])[0]
  log(job, p`│ code │ 0x${unsignedCode.toString(16).toUpperCase()}${pad.x(' ')} │`)
  log(job, p`├──────┼─${pad.x('─')}──┤`)
  log(job, p`│ dir  │ ${pad.lt(dir)} │`)
  log(job, p`├──────┴─${pad.x('─')}──┤`)

  const stderr = readFileSync(join(dir, 'stderr.txt')).toString().trim()
  if (stderr.length !== 0) {
    log(job, p`│ Error output (${stderr.length}) ${pad.x(' ')} │`)
    log(job, p`│ ${pad.w(stderr)} │`)
  } else {
    const stdout = readFileSync(join(dir, 'stdout.txt')).toString()
    if (stdout.length !== 0) {
      log(job, p`│ Standard output (${stderr.length}), last 10 lines... ${pad.x(' ')} │`)
      log(job, p`│ ${pad.w('...')} │`)
      log(job, p`│ ${pad.w(stdout.split(/\r?\n/).slice(-10).join('\n'))} │`)
    } else {
      log(job, p`│ No output ${pad.x(' ')} │`)
    }
  }
  log(job, p`└──────────${pad.x('─')}┘`)
}

function build (job) {
  let wrap
  if (interactive) {
    wrap = method => function () {
      clean(job)
      try {
        method.call(this, ...arguments)
      } finally {
        progress(job, false)
      }
    }
  } else {
    wrap = method => method
  }

  return {
    lastTick: 0,
    reportIntervalId: undefined,
    lines: 0,

    wrap: wrap(callback => callback()),

    serving: wrap(url => {
      log(job, p80()`Server running at ${pad.lt(url)}`)
    }),

    redirected: wrap(({ method, url, statusCode, timeSpent }) => {
      let statusText
      if (!statusCode) {
        statusText = 'N/A'
      } else {
        statusText = statusCode
      }
      log(job, p80()`${method} ${pad.lt(url)} ${statusText} ${timeSpent}ms`)
    }),

    status (status) {
      if (!interactive) {
        log(job, '')
        log(job, status)
        log(job, ''.padStart(status.length, '─'))
      }
    },

    watching: wrap(path => {
      log(job, p80()`Watching changes on ${pad.lt(path)}`)
    }),

    changeDetected: wrap((eventType, filename) => {
      log(job, p80()`${eventType} ${pad.lt(filename)}`)
    }),

    reportOnJobProgress () {
      if (interactive) {
        this.reportIntervalId = setInterval(progress.bind(null, job), 250)
      }
    },

    browserCapabilities: wrap(capabilities => {
      log(job, p80()`Browser capabilities :`)
      const { modules } = capabilities
      if (modules.length) {
        log(job, p80()` ├─ modules`)
        modules.forEach((module, index) => {
          let prefix
          if (index === modules.length - 1) {
            prefix = ' │  └─ '
          } else {
            prefix = ' │  ├─'
          }
          log(job, p80()`${prefix} ${pad.lt(module)}`)
        })
      }
      Object.keys(capabilities)
        .filter(key => key !== 'modules')
        .forEach((key, index, keys) => {
          let prefix
          if (index === keys.length - 1) {
            prefix = ' └─'
          } else {
            prefix = ' ├─'
          }
          log(job, p80()`${prefix} ${key}: ${JSON.stringify(capabilities[key])}`)
        })
    }),

    browserStart (url) {
      if (interactive) {
        output(job, '>>', url)
      } else {
        wrap(() => log(job, p80()`>> ${pad.lt(url)}`))
      }
    },

    browserStopped (url) {
      if (interactive) {
        output(job, '<<', url)
      } else {
        wrap(() => log(job, p80()`<< ${pad.lt(url)}`))
      }
    },

    browserClosed: wrap((url, code, dir) => {
      browserIssue(job, { type: 'unexpected closed', url, code, dir })
    }),

    browserRetry (url, retry) {
      if (interactive) {
        output(job, '>>', url)
      } else {
        wrap(() => log(job, p80()`>> RETRY ${retry} ${pad.lt(url)}`))
      }
    },

    browserTimeout: wrap((url, dir) => {
      browserIssue(job, { type: 'timeout', url, code: 0, dir })
    }),

    browserFailed: wrap((url, code, dir) => {
      browserIssue(job, { type: 'failed', url, code, dir })
    }),

    startFailed: wrap((url, error) => {
      const p = p80()
      log(job, p`┌──────────${pad.x('─')}┐`)
      log(job, p`│ UNABLE TO START THE URL ${pad.x(' ')} │`)
      log(job, p`├──────┬─${pad.x('─')}──┤`)
      log(job, p`│ url  │ ${pad.lt(url)} │`)
      log(job, p`├──────┴─${pad.x('─')}──┤`)
      if (error.stack) {
        log(job, p`│ ${pad.w(error.stack)} │`)
      } else {
        log(job, p`│ ${pad.w(error.toString())} │`)
      }
      log(job, p`└──────────${pad.x('─')}┘`)
    }),

    monitor (childProcess) {
      ['stdout', 'stderr'].forEach(channel => {
        const defaults = {
          stdout: { buffer: [], method: log },
          stderr: { buffer: [], method: err }
        }
        childProcess[channel].on('data', chunk => {
          const { buffer, method } = defaults[channel]
          const text = chunk.toString()
          if (!text.includes('\n')) {
            buffer.push(text)
            return
          }
          const cached = buffer.join('')
          const last = text.split('\n').slice(-1)
          buffer.length = 0
          if (last) {
            buffer.push(last)
          }
          wrap(() => method(job, cached + text.split('\n').slice(0, -1).join('\n')))
        })
        childProcess.on('close', () => {
          ['stdout', 'stderr'].forEach(channel => {
            const { buffer, method } = defaults[channel]
            if (buffer.length) {
              method(job, buffer.join(''))
            }
          })
        })
      })
    },

    nyc: wrap((...args) => {
      log(job, p80()`nyc ${args.map(arg => arg.toString()).join(' ')}`)
    }),

    endpointError: wrap(({ api, url, data, error }) => {
      const p = p80()
      log(job, p`┌──────────${pad.x('─')}┐`)
      log(job, p`│ UNEXPECTED ENDPOINT ERROR ${pad.x(' ')} │`)
      log(job, p`├──────┬─${pad.x('─')}──┤`)
      log(job, p`│ api  │ ${pad.lt(api)} │`)
      log(job, p`├──────┼─${pad.x('─')}──┤`)
      log(job, p`│ from │ ${pad.lt(url)} │`)
      log(job, p`├──────┴─${pad.x('─')}──┤`)
      log(job, p`│ data  (${JSON.stringify(data).length}) ${pad.x(' ')} │`)
      log(job, p`│ ${pad.w(JSON.stringify(data, undefined, 2))} │`)
      log(job, p`├────────${pad.x('─')}──┤`)
      if (error.stack) {
        log(job, p`│ ${pad.w(error.stack)} │`)
      } else {
        log(job, p`│ ${pad.w(error.toString())} │`)
      }
      log(job, p`└──────────${pad.x('─')}┘`)
    }),

    serverError: wrap(({ method, url, reason }) => {
      const p = p80()
      log(job, p`┌──────────${pad.x('─')}┐`)
      log(job, p`│ UNEXPECTED SERVER ERROR ${pad.x(' ')} │`)
      log(job, p`├──────┬─${pad.x('─')}──┤`)
      log(job, p`│ verb │ ${pad.lt(method)} │`)
      log(job, p`├──────┼─${pad.x('─')}──┤`)
      log(job, p`│ url  │ ${pad.lt(url)} │`)
      log(job, p`├──────┴─${pad.x('─')}──┤`)
      if (reason.stack) {
        log(job, p`│ ${pad.w(reason.stack)} │`)
      } else {
        log(job, p`│ ${pad.w(reason.toString())} │`)
      }
      log(job, p`└──────────${pad.x('─')}┘`)
    }),

    globalTimeout: wrap(url => {
      log(job, p80()`!! TIMEOUT ${pad.lt(url)}`)
    }),

    failFast: wrap(url => {
      log(job, p80()`!! FAILFAST ${pad.lt(url)}`)
    }),

    timeSpent: wrap((start, end = new Date()) => {
      log(job, p80()`Time spent: ${end - start}ms`)
    }),

    noTestPageFound: wrap(() => {
      err(job, p80()`No test page found (or all filtered out)`)
    }),

    failedToCacheUI5resource: wrap((path, statusCode) => {
      err(job, p80()`Unable to cache '${pad.lt(path)}' (status ${statusCode})`)
    }),

    genericError: wrap(error => {
      const p = p80()
      log(job, p`┌──────────${pad.x('─')}┐`)
      log(job, p`│ UNEXPECTED ERROR ${pad.x(' ')} │`)
      log(job, p`├────────${pad.x('─')}──┤`)
      if (error.stack) {
        log(job, p`│ ${pad.w(error.stack)} │`)
      } else {
        log(job, p`│ ${pad.w(error.toString())} │`)
      }
      log(job, p`└──────────${pad.x('─')}┘`)
    }),

    unhandled: wrap(() => {
      warn(job, p80()`Some requests are not handled properly, check the unhandled.txt report for more info`)
    }),

    results: wrap(() => {
      const p = p80()
      log(job, p`┌──────────${pad.x('─')}┐`)
      log(job, p`│ RESULTS ${pad.x(' ')} │`)
      log(job, p`├─────┬─${pad.x('─')}──┤`)
      const messages = []
      job.testPageUrls.forEach(url => {
        const page = job.qunitPages[url]
        let message
        if (!page || !page.report) {
          message = 'Unable to run the page'
        } else if (page.report.failed > 1) {
          message = `${page.report.failed} tests failed`
        } else if (page.report.failed === 1) {
          message = '1 test failed'
        }
        if (message) {
          log(job, p`│ ${(messages.length + 1).toString().padStart(3, ' ')} │ ${pad.lt(url)} │`)
          messages.push(message)
        } else {
          log(job, p`│ OK  │ ${pad.lt(url)} │`)
        }
      })
      log(job, p`└─────┴───${pad.x('─')}┘`)
      messages.forEach((message, index) => {
        log(job, p`${(index + 1).toString().padStart(3, ' ')}: ${message}`)
      })
      if (!messages.length) {
        log(job, p`Success !`)
      }
    }),

    stop () {
      if (this.reportIntervalId) {
        clearInterval(this.reportIntervalId)
        clean(job)
      }
    }
  }
}

module.exports = {
  getOutput (job) {
    if (!job[$output]) {
      job[$output] = build(job)
    }
    return job[$output]
  }
}
