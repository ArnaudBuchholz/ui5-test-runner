jest.mock('child_process') 
const { _hook: hook } = require('child_process')
const { start, stop } = require('../../src/browsers')

describe('src/job', () => {
  let log

  beforeEach(() => {
    // log = jest.spyOn(console, 'log').mockImplementation()
  })

  it('starts and stop a browser', () => {
    hook.once('new', childProcess => {
      console.log('stop ?')
      stop('test.html')
    })
    return start('test.html')
  })

  afterAll(() => {
    // log.mockRestore()
  })
})
