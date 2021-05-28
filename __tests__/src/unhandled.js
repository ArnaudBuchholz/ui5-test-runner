const { 0: mapping } = require('../../src/unhandled')
const { custom: unhandled } = mapping

describe('src/unhandled', () => {
  let warn
  let error

  beforeAll(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation()
    error = jest.spyOn(console, 'error').mockImplementation()
  })

  const expectedIgnores = [
    'favicon.ico',
    'component-preload.js',
    'button-dbg.js',
    'i18n_en.properties'
  ]
  expectedIgnores.forEach(url => {
    it(`ignores known GET patterns (${url})`, () => {
      expect(unhandled({ method: 'GET', url })).toStrictEqual(404)
      expect(warn.mock.calls.length).toStrictEqual(0)
      expect(error.mock.calls.length).toStrictEqual(0)
    })
  })

  const expectedWarnings = [
    'any-mock-data-file.json',
    'sourceFile.js'
  ]
  expectedWarnings.forEach(url => {
    it(`warns about 404 GET (${url})`, () => {
      expect(unhandled({ method: 'GET', url, headers: { referer: 'http://localhost:3475/test.html' } })).toStrictEqual(404)
      expect(warn.mock.calls.length).not.toStrictEqual(0)
      expect(error.mock.calls.length).toStrictEqual(0)
    })
  })

  it('logs errors for any other verb', () => {
    expect(unhandled({ method: 'POST', url: '/any_url', headers: { referer: 'http://localhost:3475/test.html' } })).toStrictEqual(500)
    expect(error.mock.calls.length).toStrictEqual(1)
  })

  afterAll(() => {
    warn.mockRestore()
    error.mockRestore()
  })
})
