const { join } = require('path')
const jobFactory = require('../../src/job')
const { _hook: hook } = require('child_process')
const { instrument, generateCoverageReport, mappings } = require('../../src/coverage')
const { stat: statAsync } = require('fs').promises
const { cleanDir } = require('../../src/tools')

const cwd = '/test/project'

describe('src/coverage', () => {
  let log
  let warn
  let error
  const coveragePath = join(__dirname, '../../tmp/coverage')

  beforeAll(() => {
    log = jest.spyOn(console, 'log').mockImplementation()
    warn = jest.spyOn(console, 'warn').mockImplementation()
    error = jest.spyOn(console, 'error').mockImplementation()
    return cleanDir(coveragePath)
  })

  describe('disabled', () => {
    const path = join(coveragePath, 'disabled')
    let job

    beforeAll(() => {
      job = jobFactory.fromCmdLine(cwd, [0, 0,
        `-covTempDir:${join(path, 'temp')}`,
        `-covReportDir:${join(path, 'report')}`,
        '-coverage:false'
      ])
    })

    it('does not instrument sources', async () => {
      let triggered = false
      hook.once('new', childProcess => {
        triggered = true
      })
      await instrument(job)
      expect(triggered).toStrictEqual(false)
      expect(() => statAsync(join(path, 'temp/settings/nyc.json'))).rejects.toThrow()
    })

    it('does not generate a report', async () => {
      let triggered = false
      hook.once('new', childProcess => {
        triggered = true
      })
      await generateCoverageReport(job)
      expect(triggered).toStrictEqual(false)
      expect(() => statAsync(join(path, 'temp/coverage.json'))).rejects.toThrow()
      expect(() => statAsync(join(path, 'report'))).rejects.toThrow()
    })

    it('does not create a mapping', async () => {
      const coverageMappings = mappings(job)
      expect(coverageMappings.length).toStrictEqual(0)
    })
  })

  describe('enabled', () => {
    const path = join(coveragePath, 'enabled')
    let job

    beforeAll(() => {
      job = jobFactory.fromCmdLine(cwd, [0, 0,
        `-covTempDir:${join(path, 'temp')}`,
        `-covReportDir:${join(path, 'report')}`
      ])
    })

    it('instruments sources', async () => {
      let triggered = false
      hook.once('new', childProcess => {
        triggered = true
        setTimeout(() => childProcess.emit('close'), 0)
      })
      await instrument(job)
      expect(triggered).toStrictEqual(true)
      const stat = await statAsync(join(path, 'temp/settings/nyc.json'))
      expect(stat.isFile()).toStrictEqual(true)
    })

    it('generates a report', async () => {
      let mergeTriggered = false
      let reportTriggered = false
      function newChildProcess (childProcess) {
        if (childProcess.args[0] === 'merge') {
          mergeTriggered = true
        } else if (childProcess.args[0] === 'report') {
          reportTriggered = true
        }
        setTimeout(() => childProcess.emit('close'), 0)
      }
      hook.on('new', newChildProcess)
      await generateCoverageReport(job)
      expect(mergeTriggered).toStrictEqual(true)
      expect(reportTriggered).toStrictEqual(true)
      hook.off('new', newChildProcess)
    })

    it('creates a mapping', async () => {
      const coverageMappings = mappings(job)
      expect(coverageMappings.length).toStrictEqual(1)
    })
  })

  afterAll(() => {
    expect(log.mock.calls.length).toStrictEqual(0)
    expect(warn.mock.calls.length).toStrictEqual(0)
    expect(error.mock.calls.length).toStrictEqual(0)
    log.mockRestore()
    warn.mockRestore()
    error.mockRestore()
  })
})
