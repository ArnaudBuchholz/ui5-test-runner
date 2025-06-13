const { getOutput } = require('./output')

module.exports = {
  cleanHandles (job) {
    const output = getOutput(job)
    const activeHandles = process._getActiveHandles ? process._getActiveHandles() : []
    let displayWarning = true
    for (const handle of activeHandles) {
      const className = handle && handle.constructor && handle.constructor.name
      output.debug('handle', 'active handle', className)
      if (className === 'TLSSocket') {
        if (displayWarning) {
          displayWarning = false
          output.detectedLeakOfHandles()
        }
        let info
        if (handle._httpMessage) {
          const { path, method, host, protocol } = handle._httpMessage
          info = `${method} ${protocol}//${host}${path}`
        } else {
          const { localAddress, localPort, remoteAddress, remotePort } = handle
          info = `from ${localAddress}:${localPort} to ${remoteAddress}:${remotePort}`
        }
        output.debug('handle', 'TLS socket', info)
        handle.destroy()
      }
    }
  }
}
