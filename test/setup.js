jest.mock('child_process', () => require('./child_process'))
jest.mock('node:child_process', () => require('./child_process'))
const { join } = require('path')
const { reset, mock } = require('./child_process')
const { createDir } = require('../src/tools')

let log
let warn
let error

const {
  log: nativeLog,
  warn: nativeWarn,
  error: nativeError
} = console

const tmp = join(__dirname, '../tmp')
const npmLocal = join(__dirname, '../node_modules')
const npmGlobal = join(tmp, 'npm/global')

global.normalizePath = path => path.replace(/\\/g, '/') // win -> unix

beforeAll(async () => {
  if (process.env.TEST_CONSOLE === 'allow') {
    log = jest.spyOn(console, 'log').mockImplementation((...args) => nativeLog.apply(console, args))
    warn = jest.spyOn(console, 'warn').mockImplementation((...args) => nativeWarn.apply(console, args))
    error = jest.spyOn(console, 'error').mockImplementation((...args) => nativeError.apply(console, args))
  } else {
    log = jest.spyOn(console, 'log').mockImplementation()
    warn = jest.spyOn(console, 'warn').mockImplementation()
    error = jest.spyOn(console, 'error').mockImplementation()
  }
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
  const versionOf = name => {
    const { version } = require(join(__dirname, '../node_modules', name, 'package.json'))
    return version
  }
  mock({
    api: 'exec',
    scriptPath: 'npm',
    args: ['view', 'reserve', 'version'],
    exec: async childProcess => childProcess.stdout.write(versionOf('reserve') + '\n'),
    persist: true
  })
  mock({
    api: 'exec',
    scriptPath: 'npm',
    args: ['view', 'nyc', 'version'],
    exec: async childProcess => childProcess.stdout.write(versionOf('nyc') + '\n'),
    persist: true
  })
  mock({
    api: 'fork',
    scriptPath: /text-report\.js$/,
    exec: async childProcess => childProcess.stdout.write('text report\n'),
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
