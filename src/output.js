'use strict'

const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')
const { memoryUsage } = require('process')
const {
  $browsers,
  $statusProgressCount,
  $statusProgressTotal
} = require('./symbols')
const { filename, noop, pad } = require('./tools')

const inJest = typeof jest !== 'undefined'
const interactive = process.stdout.columns !== undefined && !inJest
const $output = Symbol('output')
const $outputStart = Symbol('output-start')
const $outputProgress = Symbol('output-progress')

if (!interactive) {
  const UTF8_BOM_CODE = '\ufeff'
  process.stdout.write(UTF8_BOM_CODE)
}

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

const formatTime = duration => {
  duration = Math.ceil(duration / 1000)
  const seconds = duration % 60
  const minutes = (duration - seconds) / 60
  return minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0')
}

const getElapsed = job => formatTime(Date.now() - job[$outputStart])

function * buildCleanSequence (job) {
  const { lines } = job[$output]
  if (!lines) {
    return
  }
  yield '\x1b[?12l'
  yield `\x1b[${lines.toString()}F`
  for (let line = 0; line < lines; ++line) {
    if (line > 1) {
      yield '\x1b[1E'
    }
    yield ''.padEnd(process.stdout.columns, ' ')
  }
  if (lines > 1) {
    yield `\x1b[${(lines - 1).toString()}F`
  } else {
    yield '\x1b[1G'
  }
}

function clean (job) {
  process.stdout.write([...buildCleanSequence(job)].join(''))
}

const BAR_WIDTH = 10

function * bar (ratio, msg) {
  yield '['
  if (typeof ratio === 'string') {
    if (ratio.length > BAR_WIDTH) {
      yield ratio.substring(0, BAR_WIDTH - 3)
      yield '...'
    } else {
      const padded = ratio.padStart(BAR_WIDTH - Math.floor((BAR_WIDTH - ratio.length) / 2), '-').padEnd(BAR_WIDTH, '-')
      yield padded
    }
    yield ']     '
  } else {
    const filled = Math.floor(BAR_WIDTH * Math.min(ratio, 1))
    yield ''.padEnd(filled, '\u2588')
    yield ''.padEnd(BAR_WIDTH - filled, '\u2591')
    yield '] '
    yield Math.floor(100 * ratio).toString().padStart(3, ' ').toString()
    yield '%'
  }
  yield ' '
  const spaceLeft = process.stdout.columns - BAR_WIDTH - 14
  if (msg.length > spaceLeft) {
    yield '...'
    yield msg.substring(msg.length - spaceLeft - 3)
  } else {
    yield msg
  }
  yield '\n'
}

const TICKS = ['\u280b', '\u2819', '\u2839', '\u2838', '\u283c', '\u2834', '\u2826', '\u2827', '\u2807', '\u280f']

class Progress {
  #job = undefined

  constructor (job) {
    this.#job = job
    if (!job[$outputProgress]) {
      job[$outputProgress] = []
    }
    job[$outputProgress].push(this)
  }

  done () {
    const pos = this.#job[$outputProgress].indexOf(this)
    this.#job[$outputProgress].splice(pos, 1)
  }
}

function progress (job, cleanFirst = true) {
  if (process.send) {
    process.send({
      type: 'progress',
      count: job[$statusProgressCount],
      total: job[$statusProgressTotal]
    })
  }
  const sequence = []
  if (interactive) {
    if (cleanFirst) {
      sequence.push(...buildCleanSequence(job))
    }
  } else {
    if (job[$browsers]) {
      sequence.push(`${getElapsed(job)} │ Progress\n──────┴──────────\n`)
    } else {
      return
    }
  }
  const output = job[$output]
  output.lines = 1
  let progressRatio
  if (job.debugMemory) {
    ++output.lines
    const { rss, heapTotal, heapUsed, external, arrayBuffers } = memoryUsage()
    const fmt = size => `${(size / (1024 * 1024)).toFixed(2)}M`
    sequence.push(`MEM r:${fmt(rss)}, h:${fmt(heapUsed)}/${fmt(heapTotal)}, x:${fmt(external)}, a:${fmt(arrayBuffers)}\n`)
  }
  if (job[$outputProgress]) {
    output.lines += job[$outputProgress].length
    job[$outputProgress].forEach(({ count, total, label }) => {
      if (total !== undefined) {
        sequence.push(...bar((count || 0) / (total || 1), label))
      } else {
        sequence.push(...bar('starting', label))
      }
    })
  }
  if (job[$statusProgressTotal]) {
    progressRatio = (job[$statusProgressCount] || 0) / job[$statusProgressTotal]
  }
  const status = `${TICKS[++output.lastTick % TICKS.length]} ${job.status}`
  if (progressRatio !== undefined) {
    sequence.push(...bar(progressRatio, status))
  } else {
    sequence.push(status, '\n')
  }
  process.stdout.write(sequence.join(''))
}

function output (job, ...args) {
  writeFileSync(
    join(job.reportDir, 'output.txt'),
    args.map(arg => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg, undefined, 2)
      }
      if (arg === undefined) {
        return 'undefined'
      }
      if (arg === null) {
        return 'null'
      }
      return arg.toString()
    }).join(' ') + '\n',
    {
      encoding: 'utf-8',
      flag: 'a'
    }
  )
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
  job[$outputStart] = Date.now()

  return {
    lastTick: 0,
    reportIntervalId: undefined,
    lines: 0,

    version: () => {
      const { name, version } = require(join(__dirname, '../package.json'))
      log(job, p80()`${name}@${version}`)
      if (job.debugDevMode) {
        log(job, p80()`⚠️  Development mode ⚠️`)
      }
    },

    serving: url => {
      log(job, p80()`Server running at ${pad.lt(url)}`)
    },

    log: wrap((...texts) => {
      log(job, ...texts)
    }),

    error: wrap((...texts) => {
      err(job, ...texts)
    }),

    debug: (moduleSpecifier, ...args) => {
      const [mainModule] = moduleSpecifier.split('/')
      if (job.debugVerbose && (job.debugVerbose.includes(moduleSpecifier) || job.debugVerbose.includes(mainModule))) {
        wrap(() => {
          console.log(`🐞${moduleSpecifier}`, ...args)
          output(job, `🐞${moduleSpecifier}`, ...args)
        })()
      }
    },

    redirected: wrap(({ method, url, statusCode, timeSpent }) => {
      if (url.startsWith('/_/progress')) {
        return // avoids pollution
      }
      let statusText
      if (!statusCode) {
        statusText = 'N/A'
      } else {
        statusText = statusCode
      }
      log(job, p80()`${method.padEnd(7, ' ')} ${pad.lt(url)} ${statusText} ${timeSpent.toString().padStart(4, ' ')}ms`)
    }),

    status (status) {
      let method
      if (interactive) {
        method = output
      } else {
        method = log
      }
      const text = `${getElapsed(job)} │ ${status}`
      method(job, '')
      method(job, text)
      method(job, '──────┴'.padEnd(text.length, '─'))
      delete job[$statusProgressCount]
      delete job[$statusProgressTotal]
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
      } else if (job.outputInterval && !inJest) {
        this.reportIntervalId = setInterval(progress.bind(null, job), job.outputInterval)
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

    resolvedPackage (name, path, version) {
      if (!name.match(/@\d+\.\d+\.\d+$/)) {
        name += `@${version}`
      }
      wrap(() => log(job, p80()`${name} in ${pad.lt(path)}`))()
    },

    packageNotLatest (name, latestVersion) {
      wrap(() => log(job, `⚠️ [PKGVRS] latest version of ${name} is ${latestVersion}`))()
    },

    browserStart (url) {
      const text = p80()`${getElapsed(job)} >> ${pad.lt(url)} [${filename(url)}]`
      if (interactive) {
        output(job, text)
      } else {
        wrap(() => log(job, text))()
      }
    },

    browserStopped (url) {
      let duration = ''
      const page = job.qunitPages && job.qunitPages[url]
      if (page) {
        duration = ' (' + formatTime(page.end - page.start) + ')'
      }
      const text = p80()`${getElapsed(job)} << ${pad.lt(url)} ${duration} [${filename(url)}]`
      if (interactive) {
        output(job, text)
      } else {
        wrap(() => log(job, text))()
      }
    },

    browserClosed: wrap((url, code, dir) => {
      browserIssue(job, { type: 'unexpected closed', url, code, dir })
    }),

    browserRetry (url, retry) {
      if (interactive) {
        output(job, '>>', url)
      } else {
        wrap(() => log(job, p80()`>> RETRY ${retry} ${pad.lt(url)}`))()
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

    monitor (childProcess, live = true) {
      const defaults = {
        stdout: { buffer: [], method: log },
        stderr: { buffer: [], method: err }
      };
      ['stdout', 'stderr'].forEach(channel => {
        childProcess[channel].on('data', chunk => {
          const { buffer, method } = defaults[channel]
          const text = chunk.toString()
          if (live) {
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
            wrap(() => method(job, cached + text.split('\n').slice(0, -1).join('\n')))()
          } else {
            buffer.push(text)
          }
        })
      })
      if (live) {
        childProcess.on('close', () => {
          ['stdout', 'stderr'].forEach(channel => {
            const { buffer, method } = defaults[channel]
            if (buffer.length) {
              method(job, buffer.join(''))
            }
          })
        })
      }
      return {
        stdout: defaults.stdout.buffer,
        stderr: defaults.stderr.buffer
      }
    },

    nyc: wrap((...args) => {
      log(job, p80()`nyc ${args.map(arg => arg.toString()).join(' ')}`)
    }),

    instrumentationSkipped: wrap(() => {
      log(job, p80()`⚠️ [SKPNYC] Skipping nyc instrumentation (--url)`)
    }),

    assumingOneOrigin: wrap(() => {
      log(job, p80()`⚠️ [COVORG] Considering only one origin`)
    }),

    noInfoForAllCoverage: wrap(() => {
      log(job, p80()`⚠️ [COVALL] Unable to process all coverage, report might be incomplete`)
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

    noTestPageFound: wrap(() => {
      err(job, p80()`No test page found (or all filtered out)`)
    }),

    failedToCacheUI5resource: wrap((path, statusCode) => {
      err(job, p80()`Unable to cache '${pad.lt(path)}' (status ${statusCode})`)
    }),

    genericError: wrap((error, url) => {
      const p = p80()
      log(job, p`┌──────────${pad.x('─')}┐`)
      log(job, p`│ UNEXPECTED ERROR ${pad.x(' ')} │`)
      if (url) {
        log(job, p`├──────┬─${pad.x('─')}──┤`)
        log(job, p`│ url  │ ${pad.lt(url)} │`)
        log(job, p`├──────┴─${pad.x('─')}──┤`)
      } else {
        log(job, p`├────────${pad.x('─')}──┤`)
      }
      if (error.stack) {
        log(job, p`│ ${pad.w(error.stack)} │`)
      } else {
        log(job, p`│ ${pad.w(error.toString())} │`)
      }
      log(job, p`└──────────${pad.x('─')}┘`)
    }),

    unhandled: wrap(() => {
      warn(job, p80()`⚠️ [UNHAND] Some requests are not handled properly, check the unhandled.txt report for more info`)
    }),

    reportGeneratorFailed: wrap((generator, exitCode, buffers) => {
      const p = p80()
      log(job, p`┌──────────${pad.x('─')}┐`)
      log(job, p`│ REPORT GENERATOR FAILED ${pad.x(' ')} │`)
      log(job, p`├───────────┬─${pad.x('─')}──┤`)
      log(job, p`│ generator │ ${pad.lt(generator)} │`)
      log(job, p`├───────────┼─${pad.x('─')}──┤`)
      log(job, p`│ exit code │ ${pad.lt(exitCode.toString())} │`)
      log(job, p`├───────────┴─${pad.x('─')}──┤`)
      log(job, p`│ ${pad.w(buffers.stderr.join(''))} │`)
      log(job, p`└──────────${pad.x('─')}┘`)
    }),

    stop () {
      if (this.reportIntervalId) {
        clearInterval(this.reportIntervalId)
        if (interactive) {
          clean(job)
        }
      }
    }
  }
}

module.exports = {
  interactive,

  getOutput (job) {
    if (!job[$output]) {
      job[$output] = build(job)
    }
    return job[$output]
  },

  newProgress (job, label, total, count) {
    const progress = new Progress(job)
    Object.assign(progress, { label, total, count })
    return progress
  }
}
