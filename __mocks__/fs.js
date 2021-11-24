const fs = jest.requireActual('fs')

module.exports = {
  ...fs,
  writeFile (path, content, options, callback) {
    // This version is used only in unhandled
    callback()
  },
  accessSync: path => {
    if (path.includes('$NOT_EXISTING$')) {
      throw new Error()
    }
  }
}
