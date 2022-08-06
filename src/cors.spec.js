'use script'

const assert = require('assert')
const Request = require('reserve/mock/Request')
const Response = require('reserve/mock/Response')
const cors = require('./cors')

const origin = 'npmjs.com'

describe('src/cors', () => {
  it('handles CORS attributes', async () => {
    const request = new Request('GET', '/', { origin })
    const response = new Response()
    cors.custom(request, response)
    assert.strictEqual(response.statusCode, undefined)
    assert.strictEqual(response.headers['Access-Control-Allow-Origin'], origin)
    assert.strictEqual(response.headers['Access-Control-Allow-Credentials'], 'true')
  })

  it('handles CORS preflight', async () => {
    const request = new Request('OPTIONS', '/', { origin })
    const response = new Response()
    cors.custom(request, response)
    assert.strictEqual(response.statusCode, 200)
    assert.strictEqual(response.headers['Access-Control-Allow-Origin'], origin)
    assert.strictEqual(response.headers['Access-Control-Allow-Headers'], 'content-type, content-length, x-page-url')
    assert.strictEqual(response.headers['Access-Control-Allow-Methods'], 'GET, POST, PUT, DELETE, OPTIONS')
    assert.strictEqual(response.headers['Access-Control-Allow-Credentials'], 'true')
  })
})
