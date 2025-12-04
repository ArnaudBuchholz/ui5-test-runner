const { join } = require('path')
const { allocPromise, recreateDir } = require('../tools')
const { copyFile, readFile } = require('fs').promises

describe('junit-xml-report', () => {
  const baseReportDir = join(__dirname, '../../tmp/junit-xml-report')
  const mockExit = jest.spyOn(process, 'exit')

  beforeEach(() => jest.resetModules())

  async function executeXMLReporter () {
    const { promise, resolve } = allocPromise()
    mockExit.mockClear()
    mockExit.mockImplementation(() => resolve())
    require('./junit-xml-report')
    await promise
  }

  it('Should add attachment to system-output for failed tests with screenshot', async () => {
    const reportDir = join(baseReportDir, 'screenshot')
    await recreateDir(reportDir)
    jest.replaceProperty(process, 'argv', ['', '', reportDir])
    await copyFile(
      join(__dirname, '../../test/reporting/jobWithFailedTestAndScreenshot.js'),
      join(reportDir, 'job.js')
    )

    await executeXMLReporter()
    const junitReport = await readFile(join(reportDir, 'junit.xml'), 'utf-8')
    expect(junitReport).toMatch(/<system-out>\[\[ATTACHMENT\|screenshot[\\/]C2FfERHrn7E[\\/]da43b785.png\]\]<\/system-out>/)
    expect(mockExit).toHaveBeenCalledWith(0)
  })

  it('Should not add attachment to system-output for failed test without screenshot', async () => {
    const reportDir = join(baseReportDir, 'no-screenshot')
    await recreateDir(reportDir)
    jest.replaceProperty(process, 'argv', ['', '', reportDir])
    await copyFile(
      join(__dirname, '../../test/reporting/jobWithFailedTestNoScreenshot.js'),
      join(reportDir, 'job.js')
    )

    await executeXMLReporter()
    const junitReport = await readFile(join(reportDir, 'junit.xml'), 'utf-8')
    expect(junitReport).not.toMatch(/<system-out>/)
    expect(mockExit).toHaveBeenCalledWith(0)
  })
})
