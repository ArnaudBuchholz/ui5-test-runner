const { join } = require('path')
const { resolvePackage } = require('./npm')
const { mock } = require('child_process')
const { createDir, recreateDir } = require('./tools')
const { writeFile } = require('fs/promises')
const { fromObject } = require('./job')
const { getOutput } = require('./output')
const { UTRError } = require('./error')

const tmp = join(__dirname, '../tmp')
const npmGlobal = join(tmp, 'npm/global')

describe('src/npm', () => {
  const cwd = join(__dirname, '../test/project')
  const reportDir = join(__dirname, '../tmp/npm/report')

  let job
  let output

  beforeAll(async () => {
    await createDir(join(npmGlobal, 'existing_global'))
    await writeFile(join(npmGlobal, 'existing_global', 'package.json'), `{
  "version": "1.0.0"
}`)
    await recreateDir(reportDir)
  })

  beforeEach(() => {
    job = fromObject(cwd, {
      reportDir,
      coverage: false
    })
    job.status = 'Testing'
    output = getOutput(job)
    jest.spyOn(output, 'status')
    jest.spyOn(output, 'resolvedPackage')
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
      exec: async childProcess => {
        await createDir(join(npmGlobal, 'not_existing'))
        await writeFile(join(npmGlobal, 'not_existing', 'package.json'), `{
  "version": "1.0.0"
}`)
        childProcess.stdout.write('OK installed')
      }
    })
    const path = await resolvePackage(job, 'not_existing')
    expect(path).toStrictEqual(join(npmGlobal, 'not_existing'))
    expect(output.resolvedPackage).toHaveBeenCalledTimes(1)
  })

  it('fails if the package cannot be installed', async () => {
    mock({
      api: 'exec',
      scriptPath: 'npm',
      args: ['install', 'fail_to_install', '-g'],
      exec: childProcess => { throw new Error('KO failed') }
    })
    await expect(resolvePackage(job, 'fail_to_install')).rejects.toThrowError(UTRError.NPM_FAILED('Error: KO failed'))
    expect(output.status).toHaveBeenCalledTimes(1) // Won't restore previous status
  })
})
