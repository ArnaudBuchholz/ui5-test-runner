jest.mock('child_process', () => require('./child_process'))
const { join } = require('path')
const { reset, mock } = require('./child_process')
const { createDir } = require('../src/tools')

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

const tmp = join(__dirname, '../tmp')
const npmLocal = join(__dirname, '../node_modules')
const npmGlobal = join(tmp, 'npm/global')

beforeAll(async () => {
  log = jest.spyOn(console, 'log').mockImplementation()
  warn = jest.spyOn(console, 'warn').mockImplementation()
  error = jest.spyOn(console, 'error').mockImplementation()
  await createDir(npmGlobal)
  mock({
    api: 'exec',
    scriptPath: 'npm',
    args: ['root', '--global'],
    exec: childProcess => childProcess.stdout.write(npmGlobal),
    persist: true
  })
  mock({
    api: 'exec',
    scriptPath: 'npm',
    args: ['root'],
    exec: childProcess => childProcess.stdout.write(npmLocal),
    persist: true
  })
  mock({
    api: 'fork',
    scriptPath: /nyc\.js$/,
    actual: true,
    persist: true
  })
})

beforeEach(() => {
  reset()
})

afterAll(() => {
  expect(log.mock.calls.length).toStrictEqual(0)
  expect(warn.mock.calls.length).toStrictEqual(0)
  expect(error.mock.calls.length).toStrictEqual(0)
  log.mockRestore()
  warn.mockRestore()
  error.mockRestore()
})
