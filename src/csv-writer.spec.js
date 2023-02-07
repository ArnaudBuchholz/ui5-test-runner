const { buildCsvWriter } = require('./csv-writer')
const { writeFile } = require('fs/promises')

jest.mock('fs/promises')

describe('src/csv-writer', () => {
  const now = Date.now()

  beforeAll(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => now)
  })

  beforeEach(() => {
    writeFile.mockReset()
  })

  it('allocates an object', () => {
    const writer = buildCsvWriter('test.csv')
    expect(writer).not.toBeUndefined()
    expect(writeFile).not.toHaveBeenCalled()
  })

  it('starts writing the file on first record', async () => {
    const writer = buildCsvWriter('test.csv')
    writer.append({ text: 'test' })
    await writer.ready
    expect(writeFile.mock.calls).toEqual([
      ['test.csv', 'timestamp\ttext\n', { flag: 'a+' }],
      ['test.csv', `${now}\ttest\n`, { flag: 'a+' }]
    ])
  })

  it('ignores any additional field not used on the first append', async () => {
    const writer = buildCsvWriter('test.csv')
    writer.append({ text: 'test 1' })
    writer.append({ text: 'test 2', ignored: true })
    await writer.ready
    expect(writeFile.mock.calls).toEqual([
      ['test.csv', 'timestamp\ttext\n', { flag: 'a+' }],
      ['test.csv', `${now}\ttest 1\n`, { flag: 'a+' }],
      ['test.csv', `${now}\ttest 2\n`, { flag: 'a+' }]
    ])
  })

  it('escapes automatically complex values', async () => {
    const writer = buildCsvWriter('test.csv')
    writer.append({ number: 1, text: 'test\t1\n' })
    await writer.ready
    expect(writeFile.mock.calls).toEqual([
      ['test.csv', 'timestamp\tnumber\ttext\n', { flag: 'a+' }],
      ['test.csv', `${now}\t1\t"test\\t1\\n"\n`, { flag: 'a+' }]
    ])
  })

  it('handles provided timestamp', async () => {
    const writer = buildCsvWriter('test.csv')
    writer.append({ timestamp: 456, number: 1, text: 'test\t1\n' })
    await writer.ready
    expect(writeFile.mock.calls).toEqual([
      ['test.csv', 'timestamp\tnumber\ttext\n', { flag: 'a+' }],
      ['test.csv', '456\t1\t"test\\t1\\n"\n', { flag: 'a+' }]
    ])
  })

  it('handles record array', async () => {
    const writer = buildCsvWriter('test.csv')
    await writer.append([
      { number: 1, text: 'test\t1\n' },
      { number: 2, text: 'test\t2\n' }
    ])
    await writer.ready
    expect(writeFile.mock.calls).toEqual([
      ['test.csv', 'timestamp\tnumber\ttext\n', { flag: 'a+' }],
      ['test.csv', `${now}\t1\t"test\\t1\\n"\n${now}\t2\t"test\\t2\\n"\n`, { flag: 'a+' }]
    ])
  })
})
