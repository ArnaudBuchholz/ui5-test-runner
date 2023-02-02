class UTRError extends Error {
  get code () { return this._code }

  constructor (error, details) {
    super()
    this.name = `UTRError:${error.name}`
    this._code = error.code
    if (details) {
      this.message = details
    } else {
      this.message = error.name
    }
  }
}

const errors = [{
  name: 'GENERIC'
}, {
  name: 'NPM_FAILED'
}, {
  name: 'MISSING_OR_INVALID_BROWSER_CAPABILITIES'
}, {
  name: 'BROWSER_PROBE_FAILED'
}, {
  name: 'BROWSER_FAILED'
}, {
  name: 'BROWSER_SCREENSHOT_FAILED'
}, {
  name: 'BROWSER_SCREENSHOT_TIMEOUT'
}, {
  name: 'BROWSER_SCREENSHOT_NOT_SUPPORTED'
}, {
  name: 'QUNIT_ERROR'
}, {
  name: 'MODE_INCOMPATIBLE_OPTION'
}, {
  name: 'BROWSER_MISS_SCRIPTS_CAPABILITY'
}]

errors.forEach((error, index) => {
  error.code = -1 - index
  UTRError[`${error.name}_CODE`] = error.code
  UTRError[error.name] = function (details = '') {
    return new UTRError(error, details)
  }
})

module.exports = {
  UTRError
}
