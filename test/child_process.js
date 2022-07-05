const EventEmitter = require('events')
const _hook = new EventEmitter()

class Channel extends EventEmitter {
}

class ChildProcess extends EventEmitter {
  send (message) {
    this.emit('message.received', message)
  }

  close () {
    this._connected = false
    this.emit('close')
  }

  get scriptPath () { return this._scriptPath }
  get args () { return this._args }
  get options () { return this._options }
  get connected () { return this._connected }
  get stdout () { return this._stdout }
  get stderr () { return this._stderr }

  constructor (scriptPath, args, options) {
    super()
    this._connected = true
    this._scriptPath = scriptPath
    this._args = args
    this._options = options
    this._stdout = new Channel()
    this._stderr = new Channel()
    _hook.emit('new', this)
  }
}

module.exports = {
  fork (scriptPath, args, options) {
    return new ChildProcess(scriptPath, args, options)
  },

  _hook
}
