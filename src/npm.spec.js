const { join } = require('path')
const { resolvePackage } = require('./npm')
const { mock } = require('child_process')
const { createDir, recreateDir } = require('./tools')
const { fromObject } = require('./job')
const { getOutput } = require('./output')

const tmp = join(__dirname, '../tmp')
const npmGlobal = join(tmp, 'npm/global')

describe('src/npm', () => {
  const cwd = join(__dirname, '../test/project')
  const reportDir = join(__dirname, '../tmp/npm/report')

  let job
  let output

  beforeAll(async () => {
    await createDir(join(npmGlobal, 'existing_global'))
    await recreateDir(reportDir)
  })

  beforeEach(() => {
    job = fromObject(cwd, {
      reportDir,
      coverage: false
    })
    job.status = 'Testing'
    output = getOutput(job)
    const statusImpl = output.status
    jest.spyOn(output, 'status').mockImplementation(statusImpl)
  })

  it('detects already installed local package', async () => {
    const path = await resolvePackage(job, 'reserve')
    expect(path).toStrictEqual(join(__dirname, '../node_modules/reserve'))
  })

  it('detects already installed global package', async () => {
    const path = await resolvePackage(job, 'existing_global')
    expect(path).toStrictEqual(join(npmGlobal, 'existing_global'))
  })

  it('installs missing package globally', async () => {
    mock({
      api: 'exec',
      scriptPath: 'npm',
      args: ['install', 'not_existing', '-g'],
      exec: childProcess => childProcess.stdout.write('OK installed')
    })
    const path = await resolvePackage(job, 'not_existing')
    expect(path).toStrictEqual(join(npmGlobal, 'not_existing'))
    expect(output.status).toHaveBeenCalledTimes(2)
  })

  it('fails if the package cannot be installed', async () => {
    mock({
      api: 'exec',
      scriptPath: 'npm',
      args: ['install', 'not_existing', '-g'],
      exec: childProcess => { throw new Error('KO failed') }
    })
    await expect(resolvePackage(job, 'not_existing')).rejects.toMatchObject({
      name: 'UTRError',
      message: 'NPM_FAILED'
    })
    expect(output.status).toHaveBeenCalledTimes(1) // Won't restore previous status
  })
})
