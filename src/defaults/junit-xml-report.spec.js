const { join } = require('path')
const { allocPromise, recreateDir } = require('../tools')
const { copyFile, readFile } = require('fs').promises

describe('junit-xml-report', () => {
  jest.replaceProperty(process, 'argv', ['', '', join(__dirname, '../../tmp/junit-xml-report')])

  const reportDir = join(__dirname, '../../tmp/junit-xml-report')
  const mockExit = jest.spyOn(process, 'exit')

  beforeEach(async () => {
    await recreateDir(reportDir)
    await jest.resetModules()
  })

  async function executeXMLReporter () {
    const { promise, resolve } = allocPromise()
    mockExit.mockClear()
    mockExit.mockImplementation(() => resolve())
    require('./junit-xml-report')
    await promise
  }

  it('Should add attachment to system-output for failed tests with screenshot', async () => {
    await copyFile(
      join(__dirname, '../../test/reporting/jobWithFailedTestAndScreenshot.js'),
      join(__dirname, '../../tmp/junit-xml-report/job.js')
    )

    await executeXMLReporter()
    const junitReport = await readFile(join(reportDir, 'junit.xml'), 'utf-8')
    expect(junitReport).toMatch(/<system-out>\[\[ATTACHMENT\|junit-xml-report[\\/]C2FfERHrn7E[\\/]da43b785.png\]\]<\/system-out>/)
    expect(mockExit).toHaveBeenCalledWith(0)
  })

  it('Should not add attachment to system-output for failed test without screenshot', async () => {
    await copyFile(
      join(__dirname, '../../test/reporting/jobWithFailedTestNoScreenshot.js'),
      join(__dirname, '../../tmp/junit-xml-report/job.js')
    )

    await executeXMLReporter()
    const junitReport = await readFile(join(reportDir, 'junit.xml'), 'utf-8')
    expect(junitReport).not.toMatch(/<system-out>\[\[ATTACHMENT\|junit-xml-report[\\/]C2FfERHrn7E[\\/]da43b785.png\]\]<\/system-out>/)
    expect(mockExit).toHaveBeenCalledWith(0)
  })
})
