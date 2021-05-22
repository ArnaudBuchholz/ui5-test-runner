const { start, stop } = require('../../src/browsers')

describe('src/job', () => {
  let log
  let hook

  beforeEach(() => {
    jest.mock('child_process') 
    hook = require('child_process')._hook
    // log = jest.spyOn(console, 'log').mockImplementation()
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
