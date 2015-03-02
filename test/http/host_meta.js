var codius    = require('../../')
var assert    = require('assert')
var supertest = require('supertest')
var server    = require('../../lib/application')(codius)
var http      = supertest(server)
var fs        = require('fs')
var path      = require('path')

describe('Host Meta and Root Endpoints', function() {
  var version, publicKey

  before(function() {
    version   = JSON.parse(fs.readFileSync(path.join(__dirname+'/../../package.json')).toString()).version
    publicKey = fs.readFileSync(codius.config.get('SSL_CERT')).toString()
  })

  it('should redirect the root to host meta', function(done) {

    http.get('/').end(function(error, response) {
      assert.strictEqual(response.statusCode, 301)
      assert.strictEqual(response.headers.location, '/.well-known/host-meta.json')
      done()
    })
  })

  it('should get the host meta', function(done) {
    http.get('/.well-known/host-meta.json').end(function(error, response) {
      assert.strictEqual(response.statusCode, 200)
      assert.strictEqual(response.body.properties.documentation, 'https://codius.org/docs/using-codius/getting-started')
      assert.strictEqual(response.body.properties.version, version)
      assert.strictEqual(response.body.properties.public_key, publicKey)
      done()
    })
  })
})

