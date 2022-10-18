const { UTRError } = require('./error')
const { $valueSources } = require('./symbols')

function only (job, allowed) {
  const valueSources = job[$valueSources]
  const incompatible = Object.keys(valueSources).filter(option => {
    const source = valueSources[option]
    return source === 'cli' && !allowed.includes(option)
  })
  if (incompatible.length) {
    throw UTRError.MODE_INCOMPATIBLE_OPTION(incompatible)
  }
}

function buildAndCheckMode (job) {
  if (job.capabilities) {
    only(job, ['capabilities', 'cwd', 'port', 'browser', 'parallel', 'reportDir'])
    return 'capabilities'
  }
  if (job.url && job.url.length) {
    return 'url'
  }
  return 'legacy'
}

module.exports = {
  buildAndCheckMode
}
