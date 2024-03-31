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
      reportDir,
      url: []
    }
  })

  describe('When coming from suite (type=suite)', () => {
    function runTests (member) {
      it('keeps track of added test pages and stops browser', async () => {
        await addTestPages(job, url, { type: 'suite', pages: ['/page1.html', 'page2.html'] })
        expect(job[member]).toEqual([
          'http://localhost:8045/page1.html',
          'http://localhost:8045/page2.html'
        ])
        expect(stop).toHaveBeenCalledWith(job, url)
      })

      it('supports regexp filtering', async () => {
        job.pageFilter = 'page(1|3)'
        await addTestPages(job, url, { type: 'suite', pages: ['/page1.html', 'page2.html', 'page3.html'] })
        expect(job[member]).toEqual([
          'http://localhost:8045/page1.html',
          'http://localhost:8045/page3.html'
        ])
        expect(stop).toHaveBeenCalledWith(job, url)
      })

      it('supports parameters injection', async () => {
        job.pageParams = 'a&b'
        await addTestPages(job, url, { type: 'suite', pages: ['/page1.html', 'page2.html?test'] })
        expect(job[member]).toEqual([
          'http://localhost:8045/page1.html?a&b',
          'http://localhost:8045/page2.html?test&a&b'
        ])
        expect(stop).toHaveBeenCalledWith(job, url)
      })

      it('does not inject parameters if already present', async () => {
        job.pageParams = 'a&b'
        await addTestPages(job, url, { type: 'suite', pages: ['/page1.html?a&b', 'page2.html?a&b&test'] })
        expect(job[member]).toEqual([
          'http://localhost:8045/page1.html?a&b',
          'http://localhost:8045/page2.html?a&b&test'
        ])
        expect(stop).toHaveBeenCalledWith(job, url)
      })

      it('filters out duplicates', async () => {
        await addTestPages(job, url, { type: 'suite', pages: ['/page1.html', 'page1.html'] })
        expect(job[member]).toEqual([
          'http://localhost:8045/page1.html'
        ])
        expect(stop).toHaveBeenCalledWith(job, url)
      })

      it('supports multiple calls', async () => {
        await addTestPages(job, url, { type: 'suite', pages: ['/page1.html'] })
        await addTestPages(job, url, { type: 'suite', pages: ['page1.html', '/page2.html'] })
        expect(job[member]).toEqual([
          'http://localhost:8045/page1.html',
          'http://localhost:8045/page2.html'
        ])
      })

      it('supports absolute urls', async () => {
        await addTestPages(job, url, { type: 'suite', pages: ['/page1.html'] })
        await addTestPages(job, url, { type: 'suite', pages: ['http://localhost:8045/page2.html'] })
        expect(job[member]).toEqual([
          'http://localhost:8045/page1.html',
          'http://localhost:8045/page2.html'
        ])
      })

      it('strips hash from the URLs', async () => {
        await addTestPages(job, url, { type: 'suite', pages: ['/page1.html#'] })
        await addTestPages(job, url, { type: 'suite', pages: ['http://localhost:8045/page2.html?parameter#hash'] })
        expect(job[member]).toEqual([
          'http://localhost:8045/page1.html',
          'http://localhost:8045/page2.html?parameter'
        ])
      })
    }

    describe('--split-opa is *not* set, stacks on URLs to test', () => {
      beforeEach(() => {
        job.splitOpa = false
      })

      runTests('testPageUrls')
    })

    describe('--split-opa is set, stacks on URLs to probe', () => {
      beforeEach(() => {
        job.splitOpa = true
      })

      runTests('url')
    })
  })

  describe('When coming from a test page (type=qunit), stacks on URLs to test', () => {
    describe('--split-opa is *not* set', () => {
      beforeEach(() => {
        job.splitOpa = false
      })

      it('keeps track of the test page and stops browser', async () => {
        await addTestPages(job, url, { type: 'qunit', page: '/page.html' })
        expect(job.testPageUrls).toEqual([
          'http://localhost:8045/page.html'
        ])
        expect(stop).toHaveBeenCalledWith(job, url)
      })

      it('supports regexp filtering', async () => {
        job.pageFilter = 'page1'
        await addTestPages(job, url, { type: 'qunit', page: '/page1.html' })
        await addTestPages(job, url, { type: 'qunit', page: '/page2.html' })
        expect(job.testPageUrls).toEqual([
          'http://localhost:8045/page1.html'
        ])
        expect(stop).toHaveBeenCalledWith(job, url)
      })

      it('supports parameters injection', async () => {
        job.pageParams = 'a&b'
        await addTestPages(job, url, { type: 'qunit', page: '/page1.html' })
        await addTestPages(job, url, { type: 'qunit', page: '/page2.html?test' })
        expect(job.testPageUrls).toEqual([
          'http://localhost:8045/page1.html?a&b',
          'http://localhost:8045/page2.html?test&a&b'
        ])
        expect(stop).toHaveBeenCalledWith(job, url)
      })
    })

    describe('--split-opa is set', () => {
      beforeEach(() => {
        job.splitOpa = true
      })

      describe('OPA not detected', () => {
        it('keeps track of the test page and stops browser', async () => {
          await addTestPages(job, url, { type: 'qunit', opa: false, page: '/page.html' })
          expect(job.testPageUrls).toEqual([
            'http://localhost:8045/page.html'
          ])
          expect(stop).toHaveBeenCalledWith(job, url)
        })

        it('supports regexp filtering', async () => {
          job.pageFilter = 'page1'
          await addTestPages(job, url, { type: 'qunit', opa: false, page: '/page1.html' })
          await addTestPages(job, url, { type: 'qunit', opa: false, page: '/page2.html' })
          expect(job.testPageUrls).toEqual([
            'http://localhost:8045/page1.html'
          ])
          expect(stop).toHaveBeenCalledWith(job, url)
        })

        it('supports parameters injection', async () => {
          job.pageParams = 'a&b'
          await addTestPages(job, url, { type: 'qunit', opa: false, page: '/page1.html' })
          await addTestPages(job, url, { type: 'qunit', opa: false, page: '/page2.html?test' })
          expect(job.testPageUrls).toEqual([
            'http://localhost:8045/page1.html?a&b',
            'http://localhost:8045/page2.html?test&a&b'
          ])
          expect(stop).toHaveBeenCalledWith(job, url)
        })
      })

      describe('OPA detected', () => {
        it('keeps track of the test page and stops browser', async () => {
          await addTestPages(job, url, { type: 'qunit', opa: true, modules: ['8b5be2ec', '5201787c'], page: '/page.html' })
          expect(job.testPageUrls).toEqual([
            'http://localhost:8045/page.html?moduleId=8b5be2ec',
            'http://localhost:8045/page.html?moduleId=5201787c'
          ])
          expect(stop).toHaveBeenCalledWith(job, url)
        })

        it('supports regexp filtering', async () => {
          job.pageFilter = 'page1'
          await addTestPages(job, url, { type: 'qunit', opa: true, modules: ['8b5be2ec', '5201787c'], page: '/page1.html' })
          await addTestPages(job, url, { type: 'qunit', opa: true, modules: ['b6e6da4c', '2146609c'], page: '/page2.html' })
          expect(job.testPageUrls).toEqual([
            'http://localhost:8045/page1.html?moduleId=8b5be2ec',
            'http://localhost:8045/page1.html?moduleId=5201787c'
          ])
          expect(stop).toHaveBeenCalledWith(job, url)
        })

        it('supports parameters injection', async () => {
          job.pageParams = 'a&b'
          await addTestPages(job, url, { type: 'qunit', opa: true, modules: ['8b5be2ec', '5201787c'], page: '/page1.html' })
          await addTestPages(job, url, { type: 'qunit', opa: true, modules: ['b6e6da4c', '2146609c'], page: '/page2.html?test' })
          expect(job.testPageUrls).toEqual([
            'http://localhost:8045/page1.html?moduleId=8b5be2ec&a&b',
            'http://localhost:8045/page1.html?moduleId=5201787c&a&b',
            'http://localhost:8045/page2.html?test&moduleId=b6e6da4c&a&b',
            'http://localhost:8045/page2.html?test&moduleId=2146609c&a&b'
          ])
          expect(stop).toHaveBeenCalledWith(job, url)
        })
      })
    })
  })

  describe('When unknown (type=none), do nothing', () => {
    it('just stops the browser', async () => {
      await addTestPages(job, url, { type: 'none' })
      expect(job.url).toEqual([])
      expect(job.testPageUrls).toEqual([])
      expect(stop).toHaveBeenCalledWith(job, url)
    })
  })
})
