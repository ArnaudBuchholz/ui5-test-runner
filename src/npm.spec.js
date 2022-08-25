const { join } = require('path')
const { resolvePackage } = require('./npm')
const { reset, mock } = require('child_process')
const { createDir } = require('./tools')

const tmp = join(__dirname, '../tmp')
const npmGlobal = join(tmp, 'npm/global')

describe('src/npm', () => {
  afterEach(() => reset())

  beforeAll(async () => {
    await createDir(join(npmGlobal, 'existing_global'))
  })

  it('detects already installed local package', async () => {
    const path = await resolvePackage({}, 'reserve')
    expect(path).toStrictEqual(join(__dirname, '../node_modules/reserve'))
  })

  it('detects already installed global package', async () => {
    const path = await resolvePackage({}, 'existing_global')
    expect(path).toStrictEqual(join(npmGlobal, 'existing_global'))
  })

  it('installs missing package globally', async () => {
    const job = {}
    const $initial = Symbol('status')
    let modified = false
    let restored = false
    Object.defineProperty(job, 'status', {
      get: () => $initial,
      set: value => {
        if (value === $initial) {
          restored = true
        } else {
          modified = true
          restored = false
        }
      }
    })
    mock({
      api: 'exec',
      scriptPath: 'npm',
      args: ['install', 'not_existing', '-g'],
      exec: childProcess => childProcess.stdout.write('OK installed')
    })
    const path = await resolvePackage(job, 'not_existing')
    expect(modified).toStrictEqual(true)
    expect(restored).toStrictEqual(true)
    expect(path).toStrictEqual(join(npmGlobal, 'not_existing'))
  })

  it('fails if the package cannot be installed', async () => {
    mock({
      api: 'exec',
      scriptPath: 'npm',
      args: ['install', 'not_existing', '-g'],
      exec: childProcess => { throw new Error('KO failed') }
    })
    await expect(resolvePackage({}, 'not_existing')).rejects.toMatchObject({
      name: 'UTRError',
      message: 'NPM_FAILED'
    })
  })
})
