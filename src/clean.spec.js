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
    expect(outputDebug).toHaveBeenCalledWith('handle', 'active handle', 'Object')
  })

  it('destroys TLSSocket handles', () => {
    const tlsSocket1 = {
      constructor: {
        name: 'TLSSocket'
      },
      _httpMessage: {
        path: '/test',
        method: 'GET',
        host: 'localhost',
        protocol: 'http:'
      },
      destroy: jest.fn()
    }
    const tlsSocket2 = {
      constructor: {
        name: 'TLSSocket'
      },
      localAddress: '192.168.1.1',
      localPort: 12345,
      remoteAddress: '192.168.1.1',
      remotePort: 54321,
      destroy: jest.fn()
    }
    global.process._getActiveHandles = jest.fn(() => [tlsSocket1, tlsSocket2])
    cleanHandles(job)
    expect(outputDetectedLeakOfHandles).toHaveBeenCalled()
    expect(outputDebug).toHaveBeenCalledWith('handle', 'active handle', 'TLSSocket')
    expect(outputDebug).toHaveBeenCalledWith('handle', 'TLS socket', 'GET http://localhost/test')
    expect(outputDebug).toHaveBeenCalledWith('handle', 'TLS socket', 'from 192.168.1.1:12345 to 192.168.1.1:54321')
    expect(tlsSocket1.destroy).toHaveBeenCalled()
    expect(tlsSocket2.destroy).toHaveBeenCalled()
  })
})
