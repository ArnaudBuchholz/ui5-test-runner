const { punyexpr } = require('punyexpr')

module.exports = function executeIf (job) {
  return punyexpr(job.if)({
    ...process.env,
    NODE_MAJOR_VERSION: parseInt(parseInt(process.version.match(/v(\d+)\./)[1]))
  })
}
