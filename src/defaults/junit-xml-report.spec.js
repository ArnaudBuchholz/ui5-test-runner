
const { join } = require('path')
const { createDir, cleanDir } = require('../tools');
const { copyFile, readFile } = require('fs').promises




describe('junit-xml-report', () => {

  jest.replaceProperty(process, 'argv', ['', '', join(__dirname, '../../tmp/junit-xml-report')]);


  const reportDir = join(__dirname, '../../tmp/junit-xml-report')

  beforeEach(async () => {
    await createDir(reportDir)
    await jest.resetModules()
  });
  async function executeXMLReporter() {
    const main = await require('./junit-xml-report');
    return main();
  }
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { });
  it("Should add attachment to system-output for failed tests with screenshot", async () => {

    await copyFile(
      join(__dirname, '../../test/reporting/jobWithFailedTestAndScreenshot.js'),
      join(__dirname, '../../tmp/junit-xml-report/job.js')
    );

    await executeXMLReporter();
    const junitReport = await readFile(join(reportDir, 'junit.xml'), 'utf-8')
    expect(junitReport).toContain(`<system-out>[[ATTACHMENT|${reportDir}/C2FfERHrn7E/da43b785.png]]</system-out>`);
    expect(mockExit).toHaveBeenCalledWith(0);
  });
  it("Should not attachment to system-output for failed test without screenshot", async () => {


    await copyFile(
      join(__dirname, '../../test/reporting/jobWithFailedTestNoScreenshot.js'),
      join(__dirname, '../../tmp/junit-xml-report/job.js')
    );

    await executeXMLReporter();
    const junitReport = await readFile(join(reportDir, 'junit.xml'), 'utf-8')
    expect(junitReport).not.toContain(`<system-out>[[ATTACHMENT|${reportDir}/C2FfERHrn7E/da43b785.png]]</system-out>`);
    expect(mockExit).toHaveBeenCalledWith(0);
  });
})



