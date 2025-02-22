const { join } = require('node:path')
const { batch } = require('./batch')
const { parallelize } = require('./parallelize')
const { getOutput } = require('./output')

jest.mock('./parallelize', () => {
  return {
    parallelize: jest.fn()
  }
})

jest.mock('./output', () => {
  const output = new Proxy({}, {
    get (target, property) {
      if (!target[property]) {
        target[property] = jest.fn()
      }
      return target[property]
    }
  })
  return {
    getOutput: () => output
  }
})

describe('src/batch', () => {
  beforeEach(() => {
    parallelize.mockClear()
    getOutput({}).batchFailed.mockClear()
  })

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

  describe('error handling', () => {
    it('generates a warning when a file is not suffixed with .json', async () => {
      await batch({
        cwd: join(__dirname, '..'),
        parallel: 2,
        batch: [
          'test/batch/check.js'
        ]
      })
      expect(parallelize).not.toHaveBeenCalled()
      expect(getOutput({}).batchFailed).toHaveBeenCalledWith('test/batch/check.js', 'only folders and JSON configuration files are supported')
      expect(getOutput({}).batchFailed).toHaveBeenCalledWith(expect.any(Array), 'no match')
    })

    it('generates a warning when a configuration file is not a valid JSON', async () => {
      const path = join(__dirname, '../test/not_a_valid_json.json')
      await batch({
        cwd: join(__dirname, '..'),
        parallel: 2,
        batch: [
          path
        ]
      })
      expect(parallelize).not.toHaveBeenCalled()
      expect(getOutput({}).batchFailed).toHaveBeenCalledWith(path, 'invalid JSON configuration file')
      expect(getOutput({}).batchFailed).toHaveBeenCalledWith(expect.any(Array), 'no match')
    })

    it('generates a warning when the regular expression is invalid', async () => {
      await batch({
        cwd: join(__dirname, '..'),
        parallel: 2,
        batch: [
          '*'
        ]
      })
      expect(parallelize).not.toHaveBeenCalled()
      expect(getOutput({}).batchFailed).toHaveBeenCalledWith('*', 'invalid regular expression')
      expect(getOutput({}).batchFailed).toHaveBeenCalledWith(expect.any(Array), 'no match')
    })

    it('generates a warning when no batch item is matching', async () => {
      await batch({
        cwd: join(__dirname, '..'),
        parallel: 2,
        batch: [
          'test/batch/NOPE.json'
        ]
      })
      expect(parallelize).not.toHaveBeenCalled()
      expect(getOutput({}).batchFailed).toHaveBeenCalledWith(expect.any(Array), 'no match')
    })
  })

  describe('task execution', () => {
    // simulate batch call to grab task method
    it.todo('overrides report folder')
    it.todo('overrides coverage related folders')
    it.todo('logs success')
    it.todo('logs error')
  })
})
