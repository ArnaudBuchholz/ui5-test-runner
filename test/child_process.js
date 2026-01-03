const actualChildProcess = jest.requireActual('child_process')
const EventEmitter = require('events')

let mocks = []

function reset () {
  mocks = mocks.filter(({ persist }) => !!persist)
}

function mock (configuration) {
  mocks.push(configuration)
}

function find (childProcess) {
  const mock = mocks.filter(candidate => {
    if (candidate.api !== childProcess.api ||
      (typeof candidate.scriptPath === 'string' && candidate.scriptPath !== childProcess.scriptPath) ||
      (typeof candidate.scriptPath !== 'string' && !childProcess.scriptPath.match(candidate.scriptPath))) {
      return false
    }
    if (candidate.args) {
      return candidate.args.length === childProcess.args.length &&
        candidate.args.every((arg, index) => childProcess.args[index] === arg)
    }
    return true
  })[0]
  if (!mock) {
    throw new Error(`Missing child_process mock for ${childProcess.api} ${childProcess.scriptPath} ${JSON.stringify(childProcess.args)}`)
  }
  return mock
}

function handle (childProcess, mock) {
  setTimeout(async () => {
    try {
      await mock.exec(childProcess)
      if (mock.close !== false) {
        childProcess.close()
      }
    } catch (e) {
      childProcess.exception = e
      childProcess.stderr.write(e.toString())
      childProcess.close(-1)
    }
  }, 10) // Simulate startup time
}

class Channel extends EventEmitter {
  toString () {
    return this._buffer.join('')
  }

  setFileHandle (fileHandle) {
    if (fileHandle && typeof fileHandle.write === 'function') {
      this._fileHandle = fileHandle
    }
  }

  async write (text) {
    this._buffer.push(text)
    this.emit('data', text)
    if (this._fileHandle) {
      this._fileHandle.write(text)
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
    if (this._connected) {
      this._exitCode = code
      this._connected = false
      this.emit('close', code)
    }
  }

  get pid () { return this._pid }
  get api () { return this._api }
  get scriptPath () { return this._scriptPath }
  get args () { return this._args }
  get options () { return this._options }
  get connected () { return this._connected }
  get stdout () { return this._stdout }
  get stderr () { return this._stderr }
  get exitCode () { return this._exitCode }

  unref () {}
  kill () {
    this._killed = true
  }

  get killed () { return !!this._killed }

  constructor ({ api, scriptPath, args, options = {} }) {
    super()
    this._pid = Date.now() % 1000
    this._api = api
    this._connected = true
    this._scriptPath = scriptPath
    this._args = args
    this._options = options
    this._stdout = new Channel()
    this._stderr = new Channel()
    this._exitCode = 0
    if (options.stdio !== 'pipe') {
      const [, stdout, stderr] = options.stdio || []
      this._stdout.setFileHandle(stdout)
      this._stderr.setFileHandle(stderr)
    }
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
    const mock = find(childProcess)
    if (mock.actual) {
      return actualChildProcess.fork(scriptPath, args, options)
    }
    handle(childProcess, mock)
    return childProcess
  },

  exec (command, callback) {
    const [scriptPath, ...args] = command.split(' ')
    const childProcess = new ChildProcess({
      api: 'exec',
      scriptPath,
      args
    })
    const mock = find(childProcess)
    if (mock.actual) {
      return actualChildProcess.exec(command, callback)
    }
    if (typeof callback === 'function') {
      childProcess.on('close', function (code) {
        callback(code, this.stdout.toString(), this.stderr.toString())
      })
    }
    handle(childProcess, mock)
    return childProcess
  },

  spawn (scriptPath, args, options) {
    const childProcess = new ChildProcess({
      api: 'spawn',
      scriptPath,
      args,
      options
    })
    const mock = find(childProcess)
    if (mock.actual) {
      return actualChildProcess.spawn(scriptPath, args, options)
    }
    handle(childProcess, mock)
    return childProcess
  },

  reset,
  mock
}
