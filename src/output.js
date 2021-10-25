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
  write(`\x1b[${lines.toString()}F`)
  for (let line = 0; line < lines; ++line) {
    if (line > 1) {
      write('\x1b[1E')
    }
    write(''.padEnd(columns, ' '))
  }
  if (lines > 1) {
    write(`\x1b[${(lines - 1).toString()}F`)
  } else {
    write('\x1b[1G')
  }
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
    write(']     ')
  } else {
    const filled = Math.floor(width * ratio)
    write(''.padEnd(filled, '\u2588'), ''.padEnd(width - filled, '\u2591'))
    const percent = Math.floor(100 * ratio).toString().padStart(3, ' ')
    write('] ', percent, '%')
  }
  write(' ', msg, '\n')
}

function progress (cleanFirst = true) {
  if (cleanFirst) {
    clean()
  }
  lines = 1
  let progressRatio
  if (job.testPageUrls && job.testPages && job.parallel > 0) {
    const total = job.testPageUrls.length
    const done = Object.keys(job.testPages)
      .filter(pageUrl => !!job.testPages[pageUrl].report)
      .length
    if (done < total) {
      progressRatio = done / total
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
  const status = `${ticks[++lastTick % ticks.length]} ${job.status}`
  if (progressRatio !== undefined) {
    bar(progressRatio, status)
  } else {
    write(status, '\n')
  }
}

function wrap (write) {
  if (job) {
    clean()
  }
  write()
  if (job) {
    progress(false)
  }
}

Object.getOwnPropertyNames(console).forEach(name => {
  mockConsole[name] = function (...args) {
    wrap(() => nativeConsole[name](...args))
  }
})

if (interactive) {
  global.console = mockConsole
}

module.exports = {
  serving (url) {
    console.log(`Server running at ${url}`)
  },
  watching (path) {
    console.log('Watching changes on', path)
  },
  changeDetected (eventType, filename) {
    console.log(eventType, filename)
  },
  report (newJob) {
    job = newJob
    if (interactive) {
      process.stdout.write('\n')
      setInterval(progress, 250)
    }
  },
  browserStart (url) {
    if (!interactive) {
      console.log('>>', url)
    }
  },
  browserCapabilities (capabilities) {
    console.log('Browser capabilities :', capabilities)
  },
  browserStopped (url) {
    if (!interactive) {
      console.log('<<', url)
    }
  },
  browserClosed (url) {
    console.log('!! BROWSER CLOSED', url)
  },
  browserRetry (url, retry) {
    console.log('>> RETRY', retry, url)
  },
  browserTimeout (url) {
    console.log('!! TIMEOUT', url)
  },
  monitor (childProcess) {
    ['stdout', 'stderr'].forEach(channel => {
      childProcess[channel].on('data', chunk => {
        wrap(() => process[channel].write(chunk))
      })
    })
  },
  nyc (...args) {
    console.log('nyc', ...args)
  },
  endpoint (url, data) {
    console.log(url, data)
  },
  endpointError (url, data, error) {
    console.error(`Exception when processing ${url}`)
    console.error(data)
    console.error(error)
  },
  globalTimeout (url) {
    console.log('!! TIMEOUT', url)
  },
  failFast (url) {
    console.log('!! FAILFAST', url)
  },
  timeSpent (start, end = new Date()) {
    console.log(`Time spent: ${end - start}ms`)
  },
  unexpectedOptionValue (optionName, message) {
    console.error(`Unexpected value for option ${optionName} : ${message}`)
  },
  noTestPageFound () {
    console.error('No test page found (or all filtered out)')
  },
  failedToCacheUI5resource (path, statusCode) {
    console.error(`Unable to cache '${path}' (status ${statusCode})`)
  },
  genericError (error) {
    console.error('An unexpected error occurred', error)
  }
}
