const { describeHandle } = require('./handle')

module.exports = {
  cleanHandles () {
    const activeHandles = process._getActiveHandles ? process._getActiveHandles() : []
    for (const handle of activeHandles) {
      const { className, label } = describeHandle(handle)
      console.log('handle', 'active handle', label)
      if (className === 'TLSSocket' || className === 'Socket') {
        console.log('handle', className, label)
        handle.destroy()
      }
    }
  }
}
