const { buildCsvReader } = require('./csv-reader')
const { createReadStream } = require('fs')
const { Readable } = require('stream')

jest.mock('fs')

describe('src/csv-reader', () => {
  beforeEach(() => {
    createReadStream.mockReset()
    createReadStream.mockImplementation(() => {
      const s = new Readable()
      s._read = () => {}
      s.push(`timestamp\ttext
1\tabc
2\thello world
3\t"abc\\td"
`)
      s.push(null)
      return s
    })
  })

  it('allocates an iterator', () => {
    const reader = buildCsvReader('test.csv')
    expect(reader).not.toBeUndefined()
    expect(typeof reader.next).toBe('function')
    expect(createReadStream).not.toHaveBeenCalled()
  })

  it('reads records', async () => {
    const reader = buildCsvReader('test.csv')
    const records = []
    for await (const record of reader) {
      records.push(record)
    }
    expect(records).toEqual([
      { timestamp: '1', text: 'abc' },
      { timestamp: '2', text: 'hello world' },
      { timestamp: '3', text: 'abc\td' }
    ])
  })
})
