const { open, readdir, stat, unlink } = require('fs/promises')
const { extname, isAbsolute, join } = require('path')
const { allocPromise, filename } = require('./tools')
const { fork } = require('child_process')
const { getOutput, newProgress } = require('./output')
const { parallelize } = require('./parallelize')
const { $statusProgressCount } = require('./symbols')
const { $valueSources } = require('./symbols')
const { getCommand, toLongName } = require('./job')
const { save } = require('./report')
const { end } = require('./end')

const batchParameters = getCommand('.').options
  .filter(option => option.description.includes('📡'))
  .reduce((dictionary, option) => {
    dictionary[option.long.substring(2)] = option
    return dictionary
  }, {})

const root = join(__dirname, '..')

const folder = (job, folderPath) => {
  getOutput(job).debug('batch', `adding folder: ${folderPath}`)
  job.batchItems.push({
    path: folderPath,
    id: filename(folderPath),
    label: folderPath,
    args: ['--cwd', folderPath]
  })
}

const configurationFile = (job, configurationFilePath) => {
  getOutput(job).debug('batch', `adding configuration file: ${configurationFilePath}`)
  try {
    const {
      batchId: id = filename(configurationFilePath),
      batchLabel: label = configurationFilePath
    } = require(configurationFilePath)
    job.batchItems.push({
      path: configurationFilePath,
      id,
      label,
      args: ['--config', configurationFilePath]
    })
  } catch (e) {
    getOutput(job).batchFailed(configurationFilePath, 'invalid JSON configuration file')
  }
}

const task = async function (batchItem) {
  const { id, label, args } = batchItem
  batchItem.start = new Date()
  const job = this
  const output = getOutput(job)
  const progress = newProgress(job)
  const reportDir = join(job.reportDir, id)
  progress.label = `${label} (${id})`
  progress.count = 1
  output.batchStartingTask(label)
  const { promise, resolve, reject } = allocPromise()
  const parameters = [
    ...args,
    '--batch-mode'
  ]
  if (job[$valueSources]) {
    if (job[$valueSources].reportDir === 'cli') {
      parameters.push('--report-dir', reportDir)
    }
    Object.keys(job[$valueSources])
      .filter(name => job[$valueSources][name] === 'cli')
      .forEach(name => {
        const longName = toLongName(name)
        const option = batchParameters[longName]
        if (option) {
          parameters.push(`--${longName}`)
          if (!option.optional && !option.negate) {
            if (name === 'env') {
              Object.keys(job.env).forEach(key => {
                parameters.push(`${key}=${job.env[key]}`)
              })
            } else if (option.variadic) {
              parameters.push(...job[name].map(value => value.toString()))
            } else {
              parameters.push(job[name].toString())
            }
          }
        }
      })
  }

  const stdoutFilename = join(job.reportDir, `${id}.stdout.txt`)
  const stdout = await open(stdoutFilename, 'w')
  const stderrFilename = join(job.reportDir, `${id}.stderr.txt`)
  const stderr = await open(stderrFilename, 'w')
  const childProcess = fork(
    join(root, 'index.js'),
    parameters,
    {
      stdio: [0, stdout, stderr, 'ipc']
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
    await stdout.close()
    await stderr.close()
    batchItem.statusCode = code
    batchItem.end = new Date()
    if (code !== 0) {
      reject(code)
    } else {
      await unlink(stdoutFilename)
      await unlink(stderrFilename)
      resolve()
    }
  })
  return promise
    .then(() => {
      output.log('✔️ ', progress.label)
    }, (reason) => {
      ++job.failed
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
  job.start = new Date()
  job.failed = 0
  job.batchItems = []
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
        folder(job, path)
      } else if (pathStat.isFile() && extname(path) === '.json') {
        configurationFile(job, path)
      } else {
        output.batchFailed(batch, 'only folders and JSON configuration files are supported')
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
      getOutput(job).batchFailed(batch, 'invalid regular expression')
      continue
    }
    const scan = async (cwd) => {
      const names = await readdir(cwd)
      for (const name of names) {
        const path = join(cwd, name)
        const pathStat = await stat(path)
        if (pathStat.isDirectory()) {
          if (re.test(path) || re.test(path.replaceAll('\\', '/'))) {
            folder(job, path)
            continue
          }
          await scan(path)
        } else if (pathStat.isFile() && (re.test(path) || re.test(path.replaceAll('\\', '/')))) {
          configurationFile(job, path)
        }
      }
    }
    await scan(job.cwd)
  }
  if (job.batchItems.length) {
    job.status = 'Running batch items...'
    await parallelize(task.bind(job), job.batchItems, job.parallel)
  } else {
    output.batchFailed(job.batch, 'no match')
  }

  job.end = new Date()
  job.failed = !!job.failed
  if (job.failed) {
    process.exitCode = -1
  }
  await save(job)
  if (job.endScript) {
    await end(job)
  }
  output.stop()
  return 0
}

module.exports = { batch, task }
