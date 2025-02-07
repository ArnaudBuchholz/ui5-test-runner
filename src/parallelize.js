const { allocPromise } = require('./tools')

function complete (task) {
  ++task.completed
  if (--task.active === 0) {
    task.resolve()
  }
}

async function run (task) {
  const {
    method,
    list,
    parallel,
    started,
    completed,
    stop,
    reject
  } = task
  const { length } = list
  if (stop || completed === length || started === length) {
    complete(task)
    return
  }
  if (task.active < parallel && length - started > task.active) {
    ++task.active
    run(task)
  }
  const index = task.started++
  const parameter = list[index]
  try {
    await method(parameter, index, list)
  } catch (error) {
    task.stop = true
    reject(error)
  }
  let remaining = list.length - index - 1
  while (task.active < (parallel + 1) && remaining) {
    --remaining
    ++task.active
    run(task)
  }
  complete(task)
}

function parallelize (method, list, parallel) {
  const { promise, resolve, reject } = allocPromise()
  const task = {
    method,
    list,
    parallel,
    started: 0,
    completed: 0,
    active: 1,
    stop: false,
    resolve,
    reject
  }
  run(task)
  return promise
}

module.exports = { parallelize }
