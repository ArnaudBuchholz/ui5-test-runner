jest.mock('child_process', () => require('./child_process'))

const EventEmitter = require('events')
const mockedOutput = new EventEmitter()

const output = jest.requireActual('../src/output')
Object.keys(output).forEach(name => {
  mockedOutput[name] = function (...args) { this.emit(name, ...args) }
})
jest.mock('../src/output', () => mockedOutput)

let log
let warn
let error

beforeAll(() => {
  log = jest.spyOn(console, 'log').mockImplementation()
  warn = jest.spyOn(console, 'warn').mockImplementation()
  error = jest.spyOn(console, 'error').mockImplementation()
})

afterAll(() => {
  expect(log.mock.calls.length).toStrictEqual(0)
  expect(warn.mock.calls.length).toStrictEqual(0)
  expect(error.mock.calls.length).toStrictEqual(0)
  log.mockRestore()
  warn.mockRestore()
  error.mockRestore()
})
