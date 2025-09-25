const { join } = require('path')
const { fromObject } = require('./job')
const { recreateDir } = require('./tools')
const { getOutput } = require('./output')
const { cleanHandles } = require('./clean')

describe('src/clean', () => {
  const reportDir = join(__dirname, '../tmp/npm/report')
  const job = fromObject(join(__dirname, '../test/project'), {
    reportDir
  })
  let _getActiveHandles
  let outputDebug
  let outputDetectedLeakOfHandles

  beforeAll(async () => {
    await recreateDir(reportDir)
    _getActiveHandles = jest.spyOn(process, '_getActiveHandles')
    const output = getOutput(job)
    outputDebug = jest.spyOn(output, 'debug')
    outputDetectedLeakOfHandles = jest.spyOn(output, 'detectedLeakOfHandles')
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    _getActiveHandles.mockRestore()
  })

  it('does nothing if no active handles', () => {
    const backupGetActiveHandles = process._getActiveHandles
    process._getActiveHandles = undefined
    cleanHandles(job)
    expect(outputDetectedLeakOfHandles).not.toHaveBeenCalled()
    expect(outputDebug).not.toHaveBeenCalled()
    process._getActiveHandles = backupGetActiveHandles
  })

  it('does nothing if method does not exist', () => {
    _getActiveHandles.mockImplementation(() => [])
    cleanHandles(job)
    expect(outputDetectedLeakOfHandles).not.toHaveBeenCalled()
    expect(outputDebug).not.toHaveBeenCalled()
  })

  it('dumps leak of handles (but no warning if not TLSSocket)', () => {
    _getActiveHandles.mockImplementation(() => [{}])
    cleanHandles(job)
    expect(outputDetectedLeakOfHandles).not.toHaveBeenCalled()
    expect(outputDebug).toHaveBeenCalledWith('handle', 'active handle', expect.any(String))
  })

  it('destroys TLSSocket handles', () => {
    const tlsSocket1 = {
      constructor: {
        name: 'TLSSocket'
      },
      destroy: jest.fn()
    }
    const tlsSocket2 = {
      constructor: {
        name: 'Socket'
      },
      destroy: jest.fn()
    }
    global.process._getActiveHandles = jest.fn(() => [tlsSocket1, tlsSocket2])
    cleanHandles(job)
    expect(outputDetectedLeakOfHandles).toHaveBeenCalled()
    expect(outputDebug).toHaveBeenCalledWith('handle', 'active handle', expect.any(String))
    expect(outputDebug).toHaveBeenCalledWith('handle', 'TLSSocket', expect.any(String))
    expect(outputDebug).toHaveBeenCalledWith('handle', 'Socket', expect.any(String))
    expect(tlsSocket1.destroy).toHaveBeenCalled()
    expect(tlsSocket2.destroy).toHaveBeenCalled()
  })
})
