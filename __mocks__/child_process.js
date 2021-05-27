const EventEmitter = require('events')
const _hook = new EventEmitter()

class ChildProcess extends EventEmitter {
  send (message) {
    this.emit('message', message)
  }

  get scriptPath () { return this._scriptPath }
  get args () { return this._args }
  get options () { return this._options }

  constructor (scriptPath, args, options) {
    super()
    this._scriptPath = scriptPath
    this._args = args
    this._options = options
    setTimeout(() => _hook.emit('new', this), 0) // Defer the call since creation is 'asynchronous'
  }
}

module.exports = {
  fork (scriptPath, args, options) {
    return new ChildProcess(scriptPath, args, options)
  },

  _hook
}
