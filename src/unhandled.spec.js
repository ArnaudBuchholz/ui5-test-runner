const { join } = require('path')
const { getOutput } = require('./output')
const jobFactory = require('./job')
const mappingFactory = require('./unhandled')

const cwd = join(__dirname, '../test/project')

describe('src/unhandled', () => {
  let unhandled
  let output
  let unhandledCall

  beforeEach(() => {
    const job = jobFactory.fromCmdLine(cwd, [])
    output = getOutput(job)
    unhandledCall = 0
    output.unhandled = () => {
      ++unhandledCall
    }
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
})
