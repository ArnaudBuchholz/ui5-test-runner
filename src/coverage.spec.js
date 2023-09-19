const { join } = require('path')
const { fromObject } = require('./job')
const { instrument, generateCoverageReport, mappings } = require('./coverage')
const { stat } = require('fs/promises')
const { cleanDir, createDir } = require('./tools')
const { getOutput } = require('./output')

describe('src/coverage', () => {
  const cwd = join(__dirname, '../test/project')
  const path = join(__dirname, '../tmp/coverage')

  beforeAll(() => {
    return cleanDir(path)
  })

  describe('disabled', () => {
    const basePath = join(path, 'disabled')
    let job

    beforeAll(async () => {
      const reportDir = join(basePath, 'report')
      await createDir(reportDir)
      job = fromObject(cwd, {
        reportDir,
        coverageTempDir: join(basePath, 'coverage/temp'),
        coverageReportDir: join(basePath, 'coverage/report'),
        coverage: false
      })
    })

    it('does not instrument sources', async () => {
      await instrument(job)
      await expect(() => stat(join(basePath, 'coverage/temp/settings/nyc.json'))).rejects.toThrow()
    })

    it('does not generate a report', async () => {
      await generateCoverageReport(job)
      await expect(() => stat(join(basePath, 'coverage/temp/coverage.json'))).rejects.toThrow()
      await expect(() => stat(join(basePath, 'coverage/report'))).rejects.toThrow()
    })

    it('does not create a mapping', async () => {
      const coverageMappings = await mappings(job)
      expect(coverageMappings.length).toStrictEqual(0)
    })
  })

  describe('enabled', () => {
    const basePath = join(path, 'enabled')
    let job

    beforeAll(async function () {
      const reportDir = join(basePath, 'report')
      await createDir(reportDir)
      job = fromObject(cwd, {
        reportDir,
        coverageTempDir: join(basePath, 'coverage/temp'),
        coverageReportDir: join(basePath, 'coverage/report'),
        coverage: true
      })
    })

    it('instruments sources', async () => {
      await instrument(job)
      const nycJsonStat = await stat(join(basePath, 'coverage/temp/settings/nyc.json'))
      expect(nycJsonStat.isFile()).toStrictEqual(true)
    })

    it('generates a report', async () => {
      await generateCoverageReport(job)
      const reportStat = await stat(join(basePath, 'coverage/report'))
      expect(reportStat.isDirectory()).toStrictEqual(true)
    })

    it('creates a mapping', async () => {
      const coverageMappings = await mappings(job)
      expect(coverageMappings.length).toStrictEqual(1)
    })

    describe('--url compatibility', () => {
      let output
      let instrumentationSkipped

      beforeAll(() => {
        output = getOutput(job)
        instrumentationSkipped = jest.spyOn(output, 'instrumentationSkipped')
      })

      beforeEach(() => {
        instrumentationSkipped.mockReset()
      })

      afterAll(() => {
        instrumentationSkipped.mockRestore()
      })

      it('does *not* instrument if the URL does not match current port', async () => {
        Object.assign(job, {
          mode: 'url',
          port: 8080,
          url: ['http://localhost:8081/whatever/test.html']
        })
        await instrument(job)
        expect(instrumentationSkipped).toHaveBeenCalled()
      })

      it('**does** instrument anyway if the URL matches current port', async () => {
        Object.assign(job, {
          mode: 'url',
          port: 8080,
          url: ['http://localhost:8080/whatever/test.html']
        })
        await instrument(job)
        expect(instrumentationSkipped).not.toHaveBeenCalled()
      })
    })
  })
})
