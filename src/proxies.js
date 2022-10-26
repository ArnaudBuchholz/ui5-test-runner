'use strict'

module.exports = job => {
  // Allow custom proxy mappings
  return job.proxies
    ? job.proxies
    : []
}
