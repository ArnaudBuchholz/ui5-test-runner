const { allocPromise } = require('./tools')

async function run (task) {
  const {
    method,
    list,
    parallel,
    started,
    completed,
    stop,
    resolve,
    reject
  } = task
  const { length } = list
  if (stop || completed === length || started === length) {
    return
  }
  const active = ++task.active
  if (active < parallel && length - started > 1) {
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
  ++task.completed
  run(task)
  if (--task.active === 0) {
    resolve()
  }
}

module.exports = function parallelize (method, list, parallel) {
  const { promise, resolve, reject } = allocPromise()
  run({
    method,
    list,
    parallel,
    started: 0,
    completed: 0,
    active: 0,
    stop: false,
    resolve,
    reject
  })
  return promise
}
