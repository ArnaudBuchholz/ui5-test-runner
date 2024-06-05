const { UTRError } = require('./error')
const { $valueSources } = require('./symbols')

function check (job, allowed, forbidden) {
  const valueSources = job[$valueSources]
  const incompatible = Object.keys(valueSources).filter(option => {
    const source = valueSources[option]
    return source === 'cli' && !option.startsWith('debug') &&
    (
      (allowed && !allowed.includes(option)) ||
      (forbidden && forbidden.includes(option))
    )
  })
  if (incompatible.length) {
    throw UTRError.MODE_INCOMPATIBLE_OPTION(incompatible.join(','))
  }
}

function buildAndCheckMode (job) {
  if (job.capabilities) {
    check(job, [
      'capabilities',
      'cwd',
      'port',
      'logServer',
      'browser',
      'parallel',
      'reportDir',
      'pageTimeout',
      'browserCloseTimeout',
      'browserRetry',
      'failFast',
      'keepAlive',
      'alternateNpmPath',
      'outputInterval'
    ])
    return 'capabilities'
  }
  if (job.url && job.url.length) {
    check(job, undefined, [
      'ui5',
      'libs',
      'mappings',
      'cache',
      'watch',
      'testsuite'
    ])
    return 'url'
  }
  check(job, undefined, [
    'coverageProxy',
    'coverageProxyInclude',
    'coverageProxyExclude'
  ])
  return 'legacy'
}

module.exports = {
  buildAndCheckMode
}
