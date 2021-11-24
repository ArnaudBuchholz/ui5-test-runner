jest.mock('child_process')
jest.mock('fs')

const EventEmitter = require('events')
const mockedOutput = new EventEmitter()

const output = jest.requireActual('../src/output')
Object.keys(output).forEach(name => {
  mockedOutput[name] = function (...args) { this.emit(name, ...args) }
})
jest.mock('../src/output', () => mockedOutput)
