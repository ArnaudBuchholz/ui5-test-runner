const { batch } = require('./batch')

describe('src/batch', () => {
  it('exposes a function', () => {
    expect(typeof batch).toStrictEqual('function')
  })
})
