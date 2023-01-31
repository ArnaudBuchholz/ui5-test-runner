const { UTRError } = require('./error')

describe('src/errors', () => {
  it('generates a fully documented error', () => {
    const error = UTRError.NPM_FAILED('test')
    expect(error.name).toStrictEqual('UTRError:NPM_FAILED')
    expect(error.code).toBeLessThan(0)
    expect(error.message).toStrictEqual('test')
  })

  it('generates a generic error', () => {
    const error = UTRError.NPM_FAILED()
    expect(error.name).toStrictEqual('UTRError:NPM_FAILED')
    expect(error.code).toBeLessThan(0)
    expect(error.message).toStrictEqual('NPM_FAILED')
  })
})
