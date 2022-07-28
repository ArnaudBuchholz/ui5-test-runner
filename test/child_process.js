const EventEmitter = require('events')
const _hook = new EventEmitter()

class Channel extends EventEmitter {
  toString () {
    return this._buffer.join('')
  }

  setStream (stream) {
    this._stream = stream
  }

  async write (text) {
    this._buffer.push(text)
    this.emit('data', text)
    if (this._stream) {
      await new Promise((resolve, reject) => {
        this._stream.write(text, err => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    }
  }

  constructor () {
    super()
    this._buffer = []
  }
}

class ChildProcess extends EventEmitter {
  send (message) {
    this.emit('message.received', message)
  }

  close (code = 0) {
    this._connected = false
    this.emit('close', code)
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
    const [, stdout, stderr] = options.stdio || []
    this._stdout.setStream(stdout)
    this._stderr.setStream(stderr)
    _hook.emit('new', this)
  }
}

module.exports = {
  fork (scriptPath, args, options) {
    return new ChildProcess(scriptPath, args, options)
  },

  exec (command, callback) {
    const [scriptPath, ...args] = command.split(' ')
    const childProcess = new ChildProcess(scriptPath, args)
    childProcess.on('close', code => {
      callback(code, childProcess.stdout.toString(), childProcess.stderr.toString())
    })
  },

  _hook
}
