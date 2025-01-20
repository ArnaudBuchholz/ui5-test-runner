const { mock: mockChildProcess } = require('child_process')
const { start } = require('./start')

describe('src/start', () => {
  let job

  beforeEach(() => {
    job = {}
  })

  it('detects equivalent script cwd\'s package.json', () => {})

  it('runs command despite cwd\'s package.json', () => {})

  it('runs command', () => {})

  describe('waiting for URL to be available', () => {
    it('detects command termination and fails', () => {})

    it('times out after expected limit and fails', () => {})

    it('succeeds when URL is available', () => {})
  })

  it('stops the command by killing all children processes', () => {})
})
