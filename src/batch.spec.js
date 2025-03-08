const { join } = require('node:path')
const { batch, task } = require('./batch')
const { parallelize } = require('./parallelize')
const { getOutput } = require('./output')
const { mock: mockChildProcess } = require('child_process')
const { $valueSources } = require('./symbols')

jest.mock('fs/promises', () => {
  const actual = jest.requireActual('fs/promises')
  return {
    ...actual,
    open: jest.fn(async (filename) => ({
      filename,
      close: jest.fn()
    })),
    unlink: jest.fn()
  }
})

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
  const progress = {
    done: jest.fn()
  }
  return {
    getOutput: () => output,
    interactive: true,
    newProgress: () => progress
  }
})

const root = join(__dirname, '..')

describe('src/batch', () => {
  beforeEach(() => {
    parallelize.mockClear()
    getOutput({}).batchFailed.mockClear()
    getOutput({}).log.mockClear()
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
          'test/e2e/JS_LEGACY.json'
        ]
      })
      expect(parallelize).toHaveBeenCalledWith(expect.any(Function), [{
        path: join(__dirname, '../test/e2e/JS_LEGACY.json'),
        id: 'JS_LEGACY',
        label: 'Legacy JS Sample',
        args: ['--config', join(__dirname, '../test/e2e/JS_LEGACY.json')],
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
        path: join(__dirname, '..', 'test/e2e/JS_LEGACY.json'),
        id: 'JS_LEGACY',
        label: 'Legacy JS Sample',
        args: ['--config', join(__dirname, '..', 'test/e2e/JS_LEGACY.json')],
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
          'test/e2e/check.js'
        ]
      })
      expect(parallelize).not.toHaveBeenCalled()
      expect(getOutput({}).batchFailed).toHaveBeenCalledWith('test/e2e/check.js', 'only folders and JSON configuration files are supported')
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
          'test/e2e/NOPE.json'
        ]
      })
      expect(parallelize).not.toHaveBeenCalled()
      expect(getOutput({}).batchFailed).toHaveBeenCalledWith(expect.any(Array), 'no match')
    })
  })

  describe('task execution', () => {
    it('specifies batch mode', async () => {
      let childProcessArgs
      mockChildProcess({
        api: 'fork',
        scriptPath: join(root, 'index.js'),
        exec: async childProcess => {
          childProcessArgs = childProcess.args
          childProcess.close()
        },
        close: false
      })
      await task({
        job: {
          reportDir: '/report'
        },
        id: 'TEST',
        label: 'test',
        args: ['--report-dir', '/test']
      })
      expect(childProcessArgs).not.toBeUndefined()
      expect(childProcessArgs.map(normalizePath)).toStrictEqual([
        '--report-dir', '/test',
        '--batch-mode'
      ])
    })

    it('specifies batch mode and overrides report folder', async () => {
      let childProcessArgs
      mockChildProcess({
        api: 'fork',
        scriptPath: join(root, 'index.js'),
        exec: async childProcess => {
          childProcessArgs = childProcess.args
          childProcess.close()
        },
        close: false
      })
      await task({
        job: {
          reportDir: '/report',
          [$valueSources]: {
            reportDir: 'cli'
          }
        },
        id: 'TEST',
        label: 'test',
        args: ['--report-dir', '/test']
      })
      expect(childProcessArgs).not.toBeUndefined()
      expect(childProcessArgs.map(normalizePath)).toStrictEqual([
        '--report-dir', '/test',
        '--batch-mode',
        '--report-dir', '/report/TEST'
      ])
    })

    it('forwards main parameters', async () => {
      let childProcessArgs
      mockChildProcess({
        api: 'fork',
        scriptPath: join(root, 'index.js'),
        exec: async childProcess => {
          childProcessArgs = childProcess.args
          childProcess.close()
        },
        close: false
      })
      await task({
        job: {
          reportDir: '/report',
          start: 'start',
          end: 'end',
          pageTimeout: 1000, // Not from cli
          globalTimeout: 1000,
          failFast: true,
          reportGenerator: ['a', 'b'],
          [$valueSources]: {
            reportDir: 'cli',
            start: 'cli',
            end: 'cli',
            globalTimeout: 'cli',
            failFast: 'cli',
            reportGenerator: 'cli',
            noCoverage: 'cli'
          }
        },
        id: 'TEST',
        label: 'test',
        args: ['--report-dir', '/test']
      })
      expect(childProcessArgs).not.toBeUndefined()
      expect(childProcessArgs.map(normalizePath)).toStrictEqual([
        '--report-dir', '/test',
        '--batch-mode',
        '--report-dir', '/report/TEST',
        '--global-timeout', '1000',
        '--fail-fast',
        '--report-generator', 'a', 'b',
        '--no-coverage'
      ])
    })

    it('logs success', async () => {
      mockChildProcess({
        api: 'fork',
        scriptPath: join(root, 'index.js'),
        exec: async childProcess => {
          childProcess.close()
        },
        close: false
      })
      await task({
        job: {
          reportDir: '/report'
        },
        id: 'TEST',
        label: 'test',
        args: []
      })
      expect(getOutput({}).log).toHaveBeenCalledWith('✔️ ', 'test (TEST)')
    })

    it('logs error', async () => {
      mockChildProcess({
        api: 'fork',
        scriptPath: join(root, 'index.js'),
        exec: async () => {
          throw new Error('failed')
        },
        close: false
      })
      await task({
        job: {
          reportDir: '/report'
        },
        id: 'TEST',
        label: 'test',
        args: []
      })
      expect(getOutput({}).log).toHaveBeenCalledWith('❌', 'test (TEST)', -1)
    })
  })
})
