const { join } = require('path')
const output = require('./output')
const jobFactory = require('./job')
const mappingFactory = require('./unhandled')

const cwd = join(__dirname, '../test/project')

describe('src/unhandled', () => {
  let log
  let warn
  let error
  let unhandled

  let unhandledCall = 0

  function incUnhandledCall () {
    ++unhandledCall
  }

  beforeAll(() => {
    log = jest.spyOn(console, 'log').mockImplementation()
    warn = jest.spyOn(console, 'warn').mockImplementation()
    error = jest.spyOn(console, 'error').mockImplementation()
    output.on('unhandled', incUnhandledCall)
  })

  beforeEach(() => {
    const job = jobFactory.fromCmdLine(cwd, [])
    unhandled = mappingFactory(job)[0].custom
    unhandledCall = 0
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
      expect(unhandledCall).toStrictEqual(0)
    })
  })

  const expectedWarnings = [
    'any-mock-data-file.json',
    'sourceFile.js'
  ]
  expectedWarnings.forEach(url => {
    it(`warns about 404 GET (${url})`, () => {
      expect(unhandled({ method: 'GET', url, headers: { referer: 'http://localhost:3475/test.html' } })).toStrictEqual(404)
      expect(unhandledCall).toStrictEqual(1)
    })
  })
  it('Warns only once', () => {
    expectedWarnings.forEach(url => {
      expect(unhandled({ method: 'GET', url, headers: { referer: 'http://localhost:3475/test.html' } })).toStrictEqual(404)
    })
    expect(unhandledCall).toStrictEqual(1)
  })

  it('logs errors for any other verb', () => {
    expect(unhandled({ method: 'POST', url: '/any_url', headers: { referer: 'http://localhost:3475/test.html' } })).toStrictEqual(500)
    expect(unhandledCall).toStrictEqual(1)
  })

  it('logs errors only once', () => {
    expect(unhandled({ method: 'POST', url: '/any_url', headers: { referer: 'http://localhost:3475/test.html' } })).toStrictEqual(500)
    expect(unhandled({ method: 'POST', url: '/any_other_url', headers: { referer: 'http://localhost:3475/test.html' } })).toStrictEqual(500)
    expect(unhandledCall).toStrictEqual(1)
  })

  afterAll(() => {
    output.off('unhandled', incUnhandledCall)
    expect(log.mock.calls.length).toStrictEqual(0)
    expect(warn.mock.calls.length).toStrictEqual(0)
    expect(error.mock.calls.length).toStrictEqual(0)
    log.mockRestore()
    warn.mockRestore()
    error.mockRestore()
  })
})
