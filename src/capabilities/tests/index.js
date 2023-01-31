const { readdirSync } = require('fs')

module.exports = readdirSync(__dirname)
  .filter(name => !name.endsWith('.js'))
  .map(name => require(`./${name}`))
  .flat()
