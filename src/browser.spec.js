const { join } = require('path')
const { mock } = require('child_process')
const jobFactory = require('./job')
const { probe, start, stop, screenshot } = require('./browsers')
const { readFile, writeFile } = require('fs/promises')
const { createDir, allocPromise } = require('./tools')

const cwd = '/test/project'
const tmp = join(__dirname, '../tmp')

describe('src/browser', () => {
  let job
  let remainingChildProcess

  beforeEach(() => {
    job = jobFactory.fromObject(cwd, {
      url: 'http://localhost:8080',
      tstReportDir: join(tmp, 'browser'),
      '--': ['argument1', 'argument2']
    })
    job.browserCapabilities = {}
  })

  afterEach(async () => {
    job.browserRetry = 0 // avoid retry in case of unexpected close
    if (remainingChildProcess) {
      await stop(job, '/test.html')
      remainingChildProcess.close() // stop command not implemented
      await remainingChildProcess.closed
    }
  })

  describe('probe', () => {
    it('starts the command with a specific config file', async () => {
      let config
      mock({
        api: 'fork',
        scriptPath: job.browser,
        exec: async childProcess => {
          config = JSON.parse((await readFile(childProcess.args[0])).toString())
          await writeFile(config.capabilities, '{}')
        }
      })
      await probe(job)
      expect(config.url).toStrictEqual('about:blank')
      expect(job.browserCapabilities.console).toStrictEqual(false)
    })

    it('fails if the browser does not generate capabilities', async () => {
      mock({
        api: 'fork',
        scriptPath: job.browser,
        exec: () => {}
      })
      await expect(probe(job)).rejects.toMatchObject({
        name: 'UTRError',
        message: 'MISSING_OR_INVALID_BROWSER_CAPABILITIES'
      })
    })

    it('reads and merge browser capabilities', async () => {
      mock({
        api: 'fork',
        scriptPath: job.browser,
        exec: async childProcess => {
          const config = JSON.parse((await readFile(childProcess.args[0])).toString())
          await writeFile(config.capabilities, JSON.stringify({
            screenshot: false,
            console: true
          }))
        }
      })
      await probe(job)
      expect(job.browserCapabilities.console).toStrictEqual(true)
      expect(job.browserCapabilities.parallel).toStrictEqual(true)
    })

    describe('dependent modules', () => {
      const npmLocal = join(tmp, 'npm/local')
      const npmGlobal = join(tmp, 'npm/global')

      beforeEach(async () => {
        await createDir(join(npmLocal, 'localModule'))
      })

      it('handles dependent modules', async () => {
        mock({
          api: 'exec',
          scriptPath: 'npm',
          args: ['install', 'globalModule', '-g'],
          exec: childProcess => childProcess.stdout.write('OK')
        })
        mock({
          api: 'fork',
          scriptPath: job.browser,
          exec: async childProcess => {
            const config = JSON.parse((await readFile(childProcess.args[0])).toString())
            await writeFile(config.capabilities, JSON.stringify({
              modules: ['localModule', 'globalModule']
            }))
          }
        })
        await probe(job)
        expect(job.browserCapabilities.modules.localModule).toStrictEqual(join(npmLocal, 'localModule'))
        expect(job.browserCapabilities.modules.globalModule).toStrictEqual(join(npmGlobal, 'globalModule'))
      })

      it('fails if a dependent module cannot be installed', async () => {
        mock({
          api: 'exec',
          scriptPath: 'npm',
          args: ['install', 'globalModule', '-g'],
          exec: childProcess => {
            childProcess.stdout.write('KO')
            childProcess.close(-1)
          },
          close: false
        })
        mock({
          api: 'fork',
          scriptPath: job.browser,
          exec: async childProcess => {
            const config = JSON.parse((await readFile(childProcess.args[0])).toString())
            await writeFile(config.capabilities, JSON.stringify({
              modules: ['localModule', 'globalModule']
            }))
          }
        })
        await expect(probe(job)).rejects.toMatchObject({
          name: 'UTRError',
          message: 'NPM_FAILED'
        })
      })
    })
  })

  describe('start and stop', () => {
    it('returns a promise resolved on stop (even if the child process remains)', async () => {
      mock({
        api: 'fork',
        scriptPath: job.browser,
        exec: async childProcess => {
          remainingChildProcess = childProcess
          setTimeout(() => stop(job, '/test.html'), 0)
        },
        close: false
      })
      await start(job, '/test.html')
    })

    it('passes URL to open', async () => {
      let config
      mock({
        api: 'fork',
        scriptPath: job.browser,
        exec: async childProcess => {
          remainingChildProcess = childProcess
          config = JSON.parse((await readFile(childProcess.args[0])).toString())
          setTimeout(() => stop(job, '/test.html'), 0)
        },
        close: false
      })
      await start(job, '/test.html')
      expect(config.url).toStrictEqual('/test.html')
    })

    it('passes browser arguments', async () => {
      let config
      mock({
        api: 'fork',
        scriptPath: job.browser,
        exec: async childProcess => {
          remainingChildProcess = childProcess
          config = JSON.parse((await readFile(childProcess.args[0])).toString())
          setTimeout(() => stop(job, '/test.html'), 0)
        },
        close: false
      })
      await start(job, '/test.html')
      expect(config.args).toEqual(['argument1', 'argument2'])
    })

    it('captures outputs', async () => {
      mock({
        api: 'fork',
        scriptPath: job.browser,
        exec: async childProcess => {
          remainingChildProcess = childProcess
          await childProcess.stdout.write('stdout')
          await childProcess.stderr.write('stderr')
          setTimeout(() => stop(job, '/test.html'), 0)
        },
        close: false
      })
      await start(job, '/test.html')
      const stdout = (await readFile(remainingChildProcess.stdoutFilename)).toString()
      expect(stdout).toStrictEqual('stdout')
      const stderr = (await readFile(remainingChildProcess.stderrFilename)).toString()
      expect(stderr).toStrictEqual('stderr')
    })

    it('stops automatically after a timeout', async () => {
      const { promise: waitingForStop, resolve: stopReceived } = allocPromise()
      mock({
        api: 'fork',
        scriptPath: job.browser,
        exec: async childProcess => {
          childProcess.on('message.received', message => {
            if (message.command === 'stop') {
              childProcess.close()
              stopReceived()
            }
          })
        },
        close: false
      })
      job.pageTimeout = 100
      await Promise.all([
        start(job, '/test.html'),
        waitingForStop
      ])
    })

    it('retries on abnormal termination', async () => {
      let config
      mock({
        api: 'fork',
        scriptPath: job.browser,
        exec: async childProcess => {
          config = JSON.parse((await readFile(childProcess.args[0])).toString())
          if (config.retry === 0) {
            childProcess.close(-1)
          } else {
            remainingChildProcess = childProcess
            setTimeout(() => stop(job, '/test.html'), 0)
          }
        },
        close: false
      })
      await start(job, '/test.html')
      expect(config.retry).toStrictEqual(1)
    })

    it('fails after all retries', async () => {
      let config
      mock({
        api: 'fork',
        scriptPath: job.browser,
        exec: async childProcess => {
          config = JSON.parse((await readFile(childProcess.args[0])).toString())
          childProcess.close(-1)
        },
        close: false
      })
      await expect(start(job, '/test.html')).rejects.toMatchObject({
        name: 'UTRError',
        message: 'BROWSER_FAILED'
      })
      expect(config.retry).toStrictEqual(1)
    })

    const parallels = [2, 3, 4, 6]
    parallels.forEach(parallel =>
      it(`can run more than one page simultaneously (${parallel})`, async () => {
        let ready
        let setReady
        mock({
          api: 'fork',
          scriptPath: job.browser,
          exec: async childProcess => {
            childProcess.on('message.received', async message => {
              if (message.command === 'stop') {
                childProcess.close()
              }
            })
            setReady()
          },
          close: false
        })
        const startPromises = []
        for (let step = 0; step < parallel; ++step) {
          const allocatedPromise = allocPromise()
          ready = allocatedPromise.promise
          setReady = allocatedPromise.resolve
          const promise = start(job, `/test${step}.html`)
          await ready
          startPromises.push(promise)
        }
        for (let step = 0; step < parallel; ++step) {
          const promise = startPromises[step]
          await stop(job, `/test${step}.html`)
          await promise
        }
      })
    )

    it('ignores unknown pages', async () => {
      job.browsers = {}
      await stop(job, '/unknown.html')
    })

    it('ignores unknown messages', async () => {
      const { promise: waitingForReady, resolve: ready } = allocPromise()
      mock({
        api: 'fork',
        scriptPath: job.browser,
        exec: async childProcess => {
          childProcess.emit('message', {
            command: 'unknown'
          })
          childProcess.on('message.received', async message => {
            if (message.command === 'stop') {
              childProcess.close()
            }
          })
          ready()
        },
        close: false
      })
      const started = start(job, '/test.html')
      await waitingForReady
      await stop(job, '/test.html')
      await started
    })
  })

  describe('script injection', () => {
    beforeEach(() => {
      job.browserCapabilities.scripts = true
    })

    it('does not use any script by default', async () => {
      let config
      mock({
        api: 'fork',
        scriptPath: job.browser,
        exec: async childProcess => {
          remainingChildProcess = childProcess
          config = JSON.parse((await readFile(childProcess.args[0])).toString())
          setTimeout(() => stop(job, '/test.html'), 0)
        },
        close: false
      })
      await start(job, '/test.html')
      expect(config.scripts).toEqual([])
    })

    it('injects window[\'ui5-test-runner/base-host\'] before any script', async () => {
      let config
      mock({
        api: 'fork',
        scriptPath: job.browser,
        exec: async childProcess => {
          remainingChildProcess = childProcess
          config = JSON.parse((await readFile(childProcess.args[0])).toString())
          setTimeout(() => stop(job, '/test.html'), 0)
        },
        close: false
      })
      await start(job, '/test.html', ['whatever'])
      expect(config.scripts.length).toEqual(2)
      expect(config.scripts[0]).toEqual('window[\'ui5-test-runner/base-host\'] = \'http://localhost:0\'\n')
      expect(config.scripts[1]).toEqual('whatever')
    })

    it('translates pre-defined scripts', async () => {
      let config
      mock({
        api: 'fork',
        scriptPath: job.browser,
        exec: async childProcess => {
          remainingChildProcess = childProcess
          config = JSON.parse((await readFile(childProcess.args[0])).toString())
          setTimeout(() => stop(job, '/test.html'), 0)
        },
        close: false
      })
      await start(job, '/test.html', ['post.js'])
      expect(config.scripts.length).toEqual(2)
      expect(config.scripts[1]).toMatch(/ui5-test-runner\/base-host/)
      expect(config.scripts[1]).toMatch(/ui5-test-runner\/post/)
      expect(config.scripts[1]).toMatch(/function post \(url, data\)/)
    })
  })

  describe('screenshot', () => {
    describe('supporting', () => {
      beforeEach(() => {
        job.browserCapabilities.screenshot = '.png'
      })

      it('should generate a file', async () => {
        const { promise: ready, resolve: setReady } = allocPromise()
        let fileName
        mock({
          api: 'fork',
          scriptPath: job.browser,
          exec: async childProcess => {
            remainingChildProcess = childProcess
            childProcess.on('message.received', async message => {
              if (message.command === 'screenshot') {
                fileName = message.filename
                await writeFile(fileName, 'some random content to avoid empty file')
                childProcess.emit('message', message)
              }
            })
            setReady()
          },
          close: false
        })
        const started = start(job, '/test.html')
        await ready
        const result = await screenshot(job, '/test.html', 'screenshot')
        expect(fileName).toMatch(/\bscreenshot\.png$/)
        expect(result).toStrictEqual(fileName)
        stop(job, '/test.html')
        await started
      })

      it('fails if the file is missing', async () => {
        const { promise: ready, resolve: setReady } = allocPromise()
        mock({
          api: 'fork',
          scriptPath: job.browser,
          exec: async childProcess => {
            remainingChildProcess = childProcess
            childProcess.on('message.received', async message => {
              if (message.command === 'screenshot') {
                childProcess.emit('message', message)
              }
            })
            setReady()
          },
          close: false
        })
        start(job, '/test.html')
        await ready
        await expect(screenshot(job, '/test.html', 'screenshot')).rejects.toMatchObject({
          name: 'UTRError',
          message: 'BROWSER_SCREENSHOT_FAILED'
        })
      })

      it('fails if the file is empty', async () => {
        const { promise: ready, resolve: setReady } = allocPromise()
        mock({
          api: 'fork',
          scriptPath: job.browser,
          exec: async childProcess => {
            remainingChildProcess = childProcess
            childProcess.on('message.received', async message => {
              if (message.command === 'screenshot') {
                await writeFile(message.filename, '')
                childProcess.emit('message', message)
              }
            })
            setReady()
          },
          close: false
        })
        start(job, '/test.html')
        await ready
        await expect(screenshot(job, '/test.html', 'screenshot')).rejects.toMatchObject({
          name: 'UTRError',
          message: 'BROWSER_SCREENSHOT_FAILED'
        })
      })

      it('fails after a timeout', async () => {
        const { promise: ready, resolve: setReady } = allocPromise()
        job.screenshotTimeout = 10
        mock({
          api: 'fork',
          scriptPath: job.browser,
          exec: async childProcess => {
            remainingChildProcess = childProcess
            setReady()
          },
          close: false
        })
        const started = start(job, '/test.html')
        await ready
        await expect(screenshot(job, '/test.html', 'screenshot')).rejects.toMatchObject({
          name: 'UTRError',
          message: 'BROWSER_SCREENSHOT_TIMEOUT'
        })
        stop(job, '/test.html')
        await started
      })

      describe('edge cases', () => {
        it('ignores unknown pages', async () => {
          job.browsers = {}
          expect(await screenshot(job, '/unknown.html')).toBeUndefined()
        })

        it('ignores disconnected child processes', async () => {
          job.browsers = {
            '/disconnected.html': {
              childProcess: {
                connected: false
              },
              reportDir: job.tstReportDir
            }
          }
          expect(await screenshot(job, '/disconnected.html')).toBeUndefined()
        })
      })
    })

    describe('not supporting', () => {
      it('fails', async () => {
        const { promise: ready, resolve: setReady } = allocPromise()
        mock({
          api: 'fork',
          scriptPath: job.browser,
          exec: async childProcess => {
            remainingChildProcess = childProcess
            setReady()
          },
          close: false
        })
        const started = start(job, '/test.html')
        await ready
        await expect(screenshot(job, '/test.html', 'screenshot')).rejects.toMatchObject({
          name: 'UTRError',
          message: 'BROWSER_SCREENSHOT_NOT_SUPPORTED'
        })
        stop(job, '/test.html')
        await started
      })
    })
  })
})
