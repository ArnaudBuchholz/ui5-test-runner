const { getOutput } = require('./output')
const { describeHandle } = require('./handle')

module.exports = {
  cleanHandles (job) {
    const output = getOutput(job)
    const activeHandles = process._getActiveHandles ? process._getActiveHandles() : []
    let displayWarning = true
    for (const handle of activeHandles) {
      const { className, label } = describeHandle(handle)
      output.debug('handle', 'active handle', label)
      if (className === 'TLSSocket' || className === 'Socket') {
        if (displayWarning) {
          displayWarning = false
          output.detectedLeakOfHandles()
        }
        output.debug('handle', className, label)
        handle.destroy()
      }
    }
  }
}
