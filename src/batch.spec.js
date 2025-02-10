const { join } = require('node:path')
const { batch } = require('./batch')
const { parallelize } = require('./parallelize')

jest.mock('./parallelize', () => {
  return {
    parallelize: jest.fn()
  }
})

describe('src/batch', () => {
  it('exposes a function', () => {
    expect(typeof batch).toStrictEqual('function')
  })

  describe('configuration files', () => {
    it('reads configuration files', async () => {
      await batch({
        cwd: join(__dirname, '..'),
        parallel: 2,
        batch: [
          'test/batch/JS_LEGACY.json'
        ]
      })
      expect(parallelize).toHaveBeenCalledWith(expect.any(Function), [{
        id: 'JS_LEGACY',
        label: 'Legacy JS Sample',
        args: ['--config', join(__dirname, '..', 'test/batch/JS_LEGACY.json')],
        job: expect.any(Object)
      }], 2)
    })
  })
})
