const parallelize = require('./parallelize')

describe('src/parallelize', () => {
  const list = 'abcdefghijklmnopqrstuvwxyz'.split('')

  it('processes all the values', async () => {
    const processed = []
    await parallelize((value) => {
      processed.push(value)
    }, list, 1)
    expect(processed.length).toStrictEqual(list.length)
    expect(processed.sort()).toStrictEqual(list)
  })

  for (let parallel = 2; parallel <= 8; ++parallel) {
    it(`runs as many concurrent tasks as necessary (${parallel})`, async () => {
      const processed = []
      let active = 0
      let maxActive = 0
      await parallelize(async (value) => {
        ++active
        maxActive = Math.max(parallel, active)
        processed.push(value)
        await new Promise(resolve => setTimeout(resolve, 10))
        --active
      }, list, parallel)
      expect(processed.length).toStrictEqual(list.length)
      expect(processed.sort()).toStrictEqual(list)
      expect(maxActive).toStrictEqual(parallel)
    })
  }

  it('fails if one task fails', async () => {
    const processed = []
    const error = new Error('KO')
    const promise = parallelize(async (value) => {
      if (value === 'f') {
        throw error
      }
      processed.push(value)
    }, list, 4)
    await expect(promise).rejects.toThrow(error)
    expect(processed.length).not.toStrictEqual(list.length)
  })
})
