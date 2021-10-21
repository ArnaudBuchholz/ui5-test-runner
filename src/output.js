const _console = console
const mockConsole = {}

Object.getOwnPropertyNames(console).forEach(name => {
  mockConsole[name] = function (...args) {
    _console[name](...args)
  }
})

global.console = mockConsole
