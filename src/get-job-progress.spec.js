const { getJobProgress } = require('./get-job-progress')
const { Response } = require('reserve')

describe('src/get-job-progress', () => {
  const url = 'https://localhost:8080/tests/unitTests.qunit.html'
  const id = 'abcdef'
  const firstTestId = '8ef4ee8b'

  const job = {
    cwd: '.',
    port: 8080,
    ui5: 'https://ui5.sap.com',
    testPageUrls: [url],
    qunitPages: {
      [url]: {
        id,
        start: '2023-01-09T12:49:34.255Z',
        failed: 0,
        passed: 2,
        count: 3,
        modules: [{
          name: 'module',
          tests: [{
            name: 'First test',
            testId: firstTestId,
            logs: ['whatever it contains'],
            report: {
              skipped: false,
              todo: false,
              failed: 0,
              passed: 1,
              total: 1,
              runtime: 3
            }
          }, {
            name: 'Second test',
            testId: '35d36b9d',
            logs: [],
            report: {
              skipped: false,
              todo: false,
              failed: 0,
              passed: 1,
              total: 1,
              runtime: 5
            }
          }, {
            name: 'Third test',
            testId: 'e32c4c98',
            logs: [],
            report: {
              skipped: false,
              todo: false,
              failed: 1,
              passed: 0,
              total: 1,
              runtime: 3
            }
          }]
        }]
      }
    }
  }

  it('returns job without modules', async () => {
    const response = new Response()
    await getJobProgress(job, {}, response)
    await response.waitForFinish()
    const json = JSON.parse(response.toString())
    expect(json).toStrictEqual({
      cwd: '.',
      port: 8080,
      ui5: 'https://ui5.sap.com',
      testPageUrls: [url],
      qunitPages: {
        [url]: {
          id,
          start: '2023-01-09T12:49:34.255Z',
          failed: 0,
          passed: 2,
          count: 3
        }
      }
    })
  })

  it('returns page without logs from page id', async () => {
    const response = new Response()
    await getJobProgress(job, {}, response, id)
    await response.waitForFinish()
    const json = JSON.parse(response.toString())
    expect(json).toStrictEqual({
      url,
      id,
      start: '2023-01-09T12:49:34.255Z',
      failed: 0,
      passed: 2,
      count: 3,
      modules: [{
        name: 'module',
        tests: [{
          name: 'First test',
          testId: '8ef4ee8b',
          report: {
            skipped: false,
            todo: false,
            failed: 0,
            passed: 1,
            total: 1,
            runtime: 3
          }
        }, {
          name: 'Second test',
          testId: '35d36b9d',
          report: {
            skipped: false,
            todo: false,
            failed: 0,
            passed: 1,
            total: 1,
            runtime: 5
          }
        }, {
          name: 'Third test',
          testId: 'e32c4c98',
          report: {
            skipped: false,
            todo: false,
            failed: 1,
            passed: 0,
            total: 1,
            runtime: 3
          }
        }]
      }]
    })
  })

  it('returns 404 if page id is unknown', async () => {
    const response = new Response()
    await getJobProgress(job, {}, response, 'unknown')
    await response.waitForFinish()
    expect(response.statusCode).toBe(404)
  })

  it('returns test page and test id', async () => {
    const response = new Response()
    await getJobProgress(job, {}, response, id, firstTestId)
    await response.waitForFinish()
    const json = JSON.parse(response.toString())
    expect(json).toStrictEqual({
      url,
      module: 'module',
      name: 'First test',
      testId: firstTestId,
      logs: ['whatever it contains'],
      report: {
        skipped: false,
        todo: false,
        failed: 0,
        passed: 1,
        total: 1,
        runtime: 3
      }
    })
  })

  it('returns 404 if test id is unknown', async () => {
    const response = new Response()
    await getJobProgress(job, {}, response, id, 'unknown')
    await response.waitForFinish()
    expect(response.statusCode).toBe(404)
  })
})
