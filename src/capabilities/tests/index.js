const { readdirSync } = require('fs')

module.exports = readdirSync(__dirname)
  .filter(name => !name.endsWith('.js'))
  .map(name => {
    const tests = require(`./${name}`)
    if (Array.isArray(tests)) {
      tests.forEach((test, index) => {
        test.name = `${name}:${index}`
      })
    } else {
      tests.name = name
    }
    return tests
  })
  .flat()
