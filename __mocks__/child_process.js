class ChildProcess {
  send (message) {
  }

  constructor (scriptPath, args, options) {
    this._scriptPath = scriptPath
    this._args = args
    this._options = options
  }
}

module.exports = {
  fork (scriptPath, args, options) {
    return new ChildProcess(scriptPath, args, options)
  }
}
