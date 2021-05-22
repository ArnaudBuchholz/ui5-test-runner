const EventEmitter = require('events')
const _hook = new EventEmitter()

class ChildProcess {
  send (message) {
  }

  constructor (scriptPath, args, options) {
    this._scriptPath = scriptPath
    this._args = args
    this._options = options
    _hook.emit('new', this)
  }
}

module.exports = {
  fork (scriptPath, args, options) {
    return new ChildProcess(scriptPath, args, options)
  },

  _hook
}

console.log('mocked')
