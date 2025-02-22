const { stat, readdir } = require('fs/promises')
const { extname, isAbsolute, join } = require('path')
const { allocPromise, filename } = require('./tools')
const { fork } = require('child_process')
const { interactive, getOutput, newProgress } = require('./output')
const { parallelize } = require('./parallelize')
const { $statusProgressCount } = require('./symbols')

const root = join(__dirname, '..')

const folder = (job, folderPath) => {
  return {
    job,
    path: folderPath,
    id: filename(folderPath),
    label: folderPath,
    args: ['--cwd', folderPath]
  }
}

const configurationFile = (job, configurationFilePath) => {
  const {
    batchId: id = filename(configurationFilePath),
    batchLabel: label = configurationFilePath
  } = require(configurationFilePath)
  return {
    job,
    path: configurationFilePath,
    id,
    label,
    args: ['--config', configurationFilePath]
  }
}

const task = async ({ job, id, label, args }) => {
  const output = getOutput(job)
  const progress = newProgress(job)
  const reportDir = join(job.reportDir, id)
  progress.label = `${label} (${id})`
  progress.count = 1
  if (!interactive) {
    output.log(`${label}...`)
  }
  const { promise, resolve, reject } = allocPromise()
  const parameters = [
    ...args,
    '--report-dir', reportDir,
    '--output-interval', '1s'
  ]
  if (parameters.includes('--coverage')) {
    parameters.push(
      '--coverage-temp-dir', join(reportDir, '.nyc_output'),
      '--coverage-report-dir', join(reportDir, 'coverage')
    )
  }
  const childProcess = fork(
    join(root, 'index'),
    parameters,
    {
      stdio: [0, 'pipe', 'pipe', 'ipc']
    }
  )
  childProcess.on('message', data => {
    if (data.type === 'progress') {
      const { count, total } = data
      progress.count = count
      progress.total = total
    }
  })
  childProcess.on('close', async code => {
    if (code !== 0) {
      reject(code)
    } else {
      resolve()
    }
  })
  return promise
    .then(() => {
      output.log('✔️ ', progress.label)
    }, (reason) => {
      ++job.errors
      output.log('❌', progress.label, reason)
    })
    .finally(() => {
      ++job[$statusProgressCount]
      progress.done()
    })
}

async function batch (job) {
  /**
   * job
   * path: full path
   * id: batchId | hash (using filename)
   * label: batchLabel | configuration file path | path
   * args: []
   *   --report-dir is always passed to aggregate reports under one root folder
   */
  const output = getOutput(job)
  const batchItems = []
  for (const batch of job.batch) {
    output.debug('batch', `processing: ${batch}`)
    // check if path
    try {
      let path = batch
      if (!isAbsolute(path)) {
        path = join(job.cwd, path)
      }
      const pathStat = await stat(path)
      if (pathStat.isDirectory()) {
        batchItems.push(folder(job, path))
      } else if (pathStat.isFile()) {
        if (extname(path) === '.json') {
          batchItems.push(configurationFile(job, path))
        }
      } else {
        output.batchFailed(batch, 'not found')
      }
      continue
    } catch (e) {
      // ignore
    }
    // Try using regular expression match
    let re
    try {
      re = new RegExp(batch)
    } catch (e) {
      getOutput(job).batchFailed(batch, e.message)
      continue
    }
    const scan = async (cwd) => {
      const names = await readdir(cwd)
      for (const name of names) {
        const path = join(cwd, name)
        const pathStat = await stat(path)
        if (pathStat.isDirectory()) {
          if (re.exec(path)) {
            batchItems.push(folder(job, path))
            continue
          }
          await scan(path)
        } else if (pathStat.isFile() && re.exec(path)) {
          batchItems.push(configurationFile(job, path))
        }
      }
    }
    await scan(job.cwd)
  }
  job.status = 'Running batch items...'
  await parallelize(task, batchItems, job.parallel)
  // TODO: end command ?
  getOutput(job).stop()
  return 0
}

module.exports = { batch }
