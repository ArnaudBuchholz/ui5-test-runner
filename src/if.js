const { punyexpr } = require('punyexpr')

function executeIf (job) {
  return punyexpr(job.if)({
    ...process.env,
    NODE_MAJOR_VERSION: parseInt(parseInt(process.version.match(/v(\d+)\./)[1]))
  })
}

module.exports = { executeIf }
