const { start, stop } = require('../../src/browsers')
const { _hook } = require('child_process')

describe('src/job', () => {
  let log

  beforeEach(() => {
    // log = jest.spyOn(console, 'log').mockImplementation()
    jest.resetModules()
  })

  describe('normal flow', () => {
    it('starts a command', () => {
      hook.once('new', childProcess => {

      })
      const promise = start('test.html')
      stop('test.html')
      return promise
    })
  })
  
  afterAll(() => {
    // log.mockRestore()
  })
})