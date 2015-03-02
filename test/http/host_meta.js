var uuid      = require('uuid')
var Promise   = require('bluebird')
var codius    = require('../../')
var assert    = require('assert')
var supertest = require('supertest')
var server    = require('../../lib/application')(codius)
var http      = supertest(server)
var fs        = require('fs')
var path      = require('path')

describe('Billing Service HTTP Interface', function() {
  var version

  before(function(done) {
    fs.readFile(path.join(__dirname+'/../../package.json'), function(error, file) {
      version = JSON.parse(file.toString()).version
      done()
    })
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
      done()
    })
  })
})

