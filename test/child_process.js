const EventEmitter = require('events')

const mocks = []

function reset () {
  mocks.length = 0
}

function mock (configuration) {
  mocks.push(configuration)
}

function find (childProcess) {
  return mocks.filter(candidate => {
    if (candidate.api !== childProcess.api ||
      (typeof candidate.scriptPath === 'string' && candidate.scriptPath !== childProcess.scriptPath) ||
      (typeof candidate.scriptPath !== 'string' && !childProcess.scriptPath.match(candidate.scriptPath))) {
      return false
    }
    if (candidate.args) {
      return candidate.args.every((arg, index) => childProcess.args[index] === arg)
    }
    return true
  })[0]
}

async function handle (childProcess) {
  const mock = find(childProcess)
  if (!mock) {
    throw new Error(`Missing child_process mock for ${childProcess.scriptPath} ${JSON.stringify(childProcess.args)}`)
  }
  try {
    await mock.exec(childProcess)
    if (mock.close !== false) {
      childProcess.close()
    }
  } catch (e) {
    childProcess.stderr.write(e.toString())
    childProcess.close(-1)
  }
}

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

  get api () { return this._api }
  get scriptPath () { return this._scriptPath }
  get args () { return this._args }
  get options () { return this._options }
  get connected () { return this._connected }
  get stdout () { return this._stdout }
  get stderr () { return this._stderr }

  constructor ({ api, scriptPath, args, options = {} }) {
    super()
    this._api = api
    this._connected = true
    this._scriptPath = scriptPath
    this._args = args
    this._options = options
    this._stdout = new Channel()
    this._stderr = new Channel()
    const [, stdout, stderr] = options.stdio || []
    this._stdout.setStream(stdout)
    this._stderr.setStream(stderr)
  }
}

module.exports = {
  fork (scriptPath, args, options) {
    const childProcess = new ChildProcess({
      api: 'fork',
      scriptPath,
      args,
      options
    })
    handle(childProcess)
    return childProcess
  },

  exec (command, callback) {
    const [scriptPath, ...args] = command.split(' ')
    const childProcess = new ChildProcess({
      api: 'exec',
      scriptPath,
      args
    })
    childProcess.on('close', function (code) {
      callback(code, this.stdout.toString(), this.stderr.toString())
    })
    handle(childProcess)
    return childProcess
  },

  reset,
  mock
}
