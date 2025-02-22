const { join } = require('node:path')
const { batch } = require('./batch')
const { parallelize } = require('./parallelize')

jest.mock('./parallelize', () => {
  return {
    parallelize: jest.fn()
  }
})

describe('src/batch', () => {
  beforeEach(() => parallelize.mockClear())

  it('exposes a function', () => {
    expect(typeof batch).toStrictEqual('function')
  })

  describe('configuration file', () => {
    it('reads configuration file', async () => {
      await batch({
        cwd: join(__dirname, '..'),
        parallel: 2,
        batch: [
          'test/batch/JS_LEGACY.json'
        ]
      })
      expect(parallelize).toHaveBeenCalledWith(expect.any(Function), [{
        path: join(__dirname, '../test/batch/JS_LEGACY.json'),
        id: 'JS_LEGACY',
        label: 'Legacy JS Sample',
        args: ['--config', join(__dirname, '../test/batch/JS_LEGACY.json')],
        job: expect.any(Object)
      }], 2)
    })
  })

  describe('configuration folder', () => {
    it('associates folder to current working directory', async () => {
      await batch({
        cwd: join(__dirname, '..'),
        parallel: 2,
        batch: [
          'test/sample.js'
        ]
      })
      expect(parallelize).toHaveBeenCalledWith(expect.any(Function), [{
        path: join(__dirname, '../test/sample.js'),
        id: expect.any(String),
        label: join(__dirname, '../test/sample.js'),
        args: ['--cwd', join(__dirname, '../test/sample.js')],
        job: expect.any(Object)
      }], 2)
    })
  })

  describe('regular expression', () => {
    it('scans cwd and matches folders or configuration files', async () => {
      await batch({
        cwd: join(__dirname, '../test'),
        parallel: 2,
        batch: [
          'sample\\.(js|ts)|JS_LEGACY\\.json'
        ]
      })
      expect(parallelize).toHaveBeenCalled()
      const items = parallelize.mock.calls[0][1]
      items.sort((a, b) => a.path.localeCompare(b.path))
      expect(items).toStrictEqual([{
        path: join(__dirname, '..', 'test/batch/JS_LEGACY.json'),
        id: 'JS_LEGACY',
        label: 'Legacy JS Sample',
        args: ['--config', join(__dirname, '..', 'test/batch/JS_LEGACY.json')],
        job: expect.any(Object)
      }, {
        path: join(__dirname, '..', 'test/sample.js'),
        id: expect.any(String),
        label: join(__dirname, '..', 'test/sample.js'),
        args: ['--cwd', join(__dirname, '..', 'test/sample.js')],
        job: expect.any(Object)
      }, {
        path: join(__dirname, '..', 'test/sample.ts'),
        id: expect.any(String),
        label: join(__dirname, '..', 'test/sample.ts'),
        args: ['--cwd', join(__dirname, '..', 'test/sample.ts')],
        job: expect.any(Object)
      }])
    })
  })
})
