jest.mock('./browsers.js', () => ({
  stop: jest.fn()
}))
const { stop } = require('./browsers')
const { join } = require('path')
const { createDir } = require('./tools')

const {
  addTestPages
} = require('./add-test-pages')

describe('src/add-test-pages', () => {
  const url = 'http://localhost:8045/index.html'
  const reportDir = join(__dirname, '../tmp/add-test-pages')
  let job

  beforeAll(() => createDir(reportDir))

  beforeEach(() => {
    stop.mockClear()
    job = {
      reportDir
    }
  })

  describe('addTestPages', () => {
    it('keeps track of added test pages and stops browser', async () => {
      await addTestPages(job, url, [
        '/page1.html',
        '/page2.html'
      ])
      expect(job.testPageUrls).toEqual([
        'http://localhost:8045/page1.html',
        'http://localhost:8045/page2.html'
      ])
      expect(stop).toHaveBeenCalledWith(job, url)
    })

    it('supports regexp filtering', async () => {
      job.pageFilter = 'page(1|3)'
      await addTestPages(job, url, [
        '/page1.html',
        '/page2.html',
        '/page3.html'
      ])
      expect(job.testPageUrls).toEqual([
        'http://localhost:8045/page1.html',
        'http://localhost:8045/page3.html'
      ])
      expect(stop).toHaveBeenCalledWith(job, url)
    })

    it('supports parameters injection', async () => {
      job.pageParams = 'a&b'
      await addTestPages(job, url, [
        '/page1.html',
        '/page2.html?test'
      ])
      expect(job.testPageUrls).toEqual([
        'http://localhost:8045/page1.html?a&b',
        'http://localhost:8045/page2.html?test&a&b'
      ])
      expect(stop).toHaveBeenCalledWith(job, url)
    })

    it('filters out duplicates', async () => {
      await addTestPages(job, url, [
        '/page1.html',
        '/page1.html'
      ])
      expect(job.testPageUrls).toEqual([
        'http://localhost:8045/page1.html'
      ])
      expect(stop).toHaveBeenCalledWith(job, url)
    })
  })
})
