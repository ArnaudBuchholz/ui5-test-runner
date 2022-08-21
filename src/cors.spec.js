'use script'

const Request = require('reserve/mock/Request')
const Response = require('reserve/mock/Response')
const cors = require('./cors')

const origin = 'npmjs.com'

describe('src/cors', () => {
  it('handles CORS attributes', async () => {
    const request = new Request('GET', '/', { origin })
    const response = new Response()
    cors.custom(request, response)
    expect(response.statusCode).toBeUndefined()
    expect(response.headers).toMatchObject({
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true'
    })
  })

  it('does not impact response if origin is missing', async () => {
    const request = new Request('GET', '/')
    const response = new Response()
    cors.custom(request, response)
    expect(response.statusCode).toBeUndefined()
    expect(response.headers).toMatchObject({})
  })

  it('handles CORS preflight', async () => {
    const request = new Request('OPTIONS', '/', { origin })
    const response = new Response()
    cors.custom(request, response)
    expect(response.statusCode).toStrictEqual(200)
    expect(response.headers).toMatchObject({
      'access-control-allow-origin': origin,
      'access-control-allow-headers': 'content-type, content-length, x-page-url',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-credentials': 'true'
    })
  })
})
