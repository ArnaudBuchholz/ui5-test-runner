const { allocPromise } = require('./tools')

function end (task) {
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
    end(task)
    return
  }
  if (task.active < parallel && length - started > 1) {
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
  ++task.completed
  ++task.active
  run(task)
  end(task)
}

module.exports = function parallelize (method, list, parallel) {
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
