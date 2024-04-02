const parallelize = require('./parallelize')

describe('src/parallelize', () => {
  const list = 'abcdefghijklmnopqrstuvwxyz'.split('')

  it('handles empty list', async () => {
    await expect(parallelize(() => {
      throw new Error('Should not have any item to process')
    }, [], 4)).resolves.toBeUndefined()
  }, 100)

  it('processes all the values', async () => {
    const processed = []
    await parallelize((value, index, array) => {
      expect(array).toStrictEqual(list)
      expect(array[index]).toStrictEqual(value)
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
        maxActive = Math.max(maxActive, active)
        processed.push(value)
        await new Promise(resolve => setTimeout(resolve, 10))
        --active
      }, list, parallel)
      expect(processed.length).toStrictEqual(list.length)
      expect(processed.sort()).toStrictEqual(list)
      expect(maxActive).toStrictEqual(parallel)
    })
  }

  it('supports growing list', async () => {
    const processed = []
    const partial = list.slice(0, 10)
    await parallelize((value) => {
      if (value === 'e') {
        partial.push(...list.slice(10))
      }
      processed.push(value)
    }, partial, 1)
    expect(processed.length).toStrictEqual(list.length)
    expect(processed.sort()).toStrictEqual(list)
  })

  it('augments parallelism (if needed) when the list is growing', async () => {
    const processed = []
    const partial = ['a']
    let active = 0
    let maxActive = 0
    await parallelize(async (value) => {
      ++active
      maxActive = Math.max(maxActive, active)
      if (value === 'a') {
        partial.push('b', 'c')
      }
      processed.push(value)
      await new Promise(resolve => setTimeout(resolve, 10))
      --active
    }, partial, 2)
    expect(processed.length).toStrictEqual(3)
    expect(processed.sort()).toStrictEqual('abc'.split(''))
    expect(maxActive).toStrictEqual(2)
  })

  it('does not go beyond the number of items', async () => {
    const processed = []
    await parallelize(async (value) => {
      processed.push(value)
    }, list, 200)
    expect(processed.length).toStrictEqual(list.length)
    expect(processed.sort()).toStrictEqual(list)
  })

  it('does not go beyond the number of items (slow start)', async () => {
    const processed = []
    const partial = ['a']
    await parallelize(async (value) => {
      if (value === 'a') {
        partial.push(...list.slice(1))
      }
      processed.push(value)
      await new Promise(resolve => setTimeout(resolve, 10))
    }, partial, 200)
    expect(processed.length).toStrictEqual(list.length)
    expect(processed.sort()).toStrictEqual(list)
  })

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
