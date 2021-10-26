jest.mock('../../src/output', () => {
  return {
    unhandled: jest.fn()
  }
})
const output = require('../../src/output')
jest.mock('fs', () => {
  return {
    writeFile: jest.fn(),
    promises: {
      stat: jest.fn(),
      mkdir: jest.fn()
    }
  }
})
const jobFactory = require('../../src/job')
const mappingFactory = require('../../src/unhandled')

describe('src/unhandled', () => {
  let log
  let warn
  let error
  let unhandled

  beforeAll(() => {
    log = jest.spyOn(console, 'log').mockImplementation()
    warn = jest.spyOn(console, 'warn').mockImplementation()
    error = jest.spyOn(console, 'error').mockImplementation()
    const job = jobFactory.fromCmdLine('/', [])
    unhandled = mappingFactory(job)[0].custom
  })

  const expectedIgnores = [
    'favicon.ico',
    'component-preload.js',
    'button-dbg.js',
    'i18n_en.properties'
  ]
  expectedIgnores.forEach(url => {
    it(`does not log known GET patterns (${url})`, () => {
      expect(unhandled({ method: 'GET', url })).toStrictEqual(404)
      expect(output.unhandled.mock.calls.length).toStrictEqual(0)
    })
  })

  const expectedWarnings = [
    'any-mock-data-file.json',
    'sourceFile.js'
  ]
  expectedWarnings.forEach((url, index) => {
    it(`warns about 404 GET (${url})`, () => {
      expect(unhandled({ method: 'GET', url, headers: { referer: 'http://localhost:3475/test.html' } })).toStrictEqual(404)
      expect(output.unhandled.mock.calls.length).toStrictEqual(1)
    })
  })

  it('logs errors for any other verb', () => {
    expect(unhandled({ method: 'POST', url: '/any_url', headers: { referer: 'http://localhost:3475/test.html' } })).toStrictEqual(500)
    expect(output.unhandled.mock.calls.length).toStrictEqual(1)
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
