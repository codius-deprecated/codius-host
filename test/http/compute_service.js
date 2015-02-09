var uuid      = require('uuid')
var Promise   = require('bluebird')
var codius    = require(__dirname+'/../../')
var assert    = require('assert')
var supertest = require('supertest')
var server    = require(__dirname+'/../../compute-service/server')(codius)
var http      = supertest(server)

describe('Compute Service HTTP Interface', function() {
  var token

// TODO: "upload" a contract
  before(function(done) {
    new codius.Token({ token: uuid.v4() }).save()
      .then(function(model) {
        token = model
        done()
      })
  })

  it.skip('should start running a container', function(done) {
    http
      .post('/instances')
      .send({
        token: token,
        // container_uri: 
        // type: 
        // vars: 
        // port: 
      })
      .end(function(error, response) {
        assert(response.body.success)
        assert.strictEqual(response.body.instance.token, token)
        assert.strictEqual(response.body.instance.state, 'running')
        done()
      })
  })

  it('should list all running containers', function(done) {
    http
      .get('/instances')
      .expect(200)
      .end(function(error, response) {
        assert(response.body.success)
        done()
      })
  })

  it.skip('should get info on single running container', function(done) {
    http
      .get('/instances/'+token)
      .end(function(error, response) {
        assert(response.body.success)
        done()
      })
  })

  it.skip('should stop a running container', function(done) {
    http
      .delete('/instances/'+token)
      .end(function(error, response) {
        assert(response.body.success)
        assert.strictEqual(response.body.instance.state, 'stopping')
        done()
      })
  })

  it.skip('should get a quote to run a container', function(done) {
    http
      .get('/quote')
      .end(function(error, response) {
        assert(response.body.success)
      })
  })

})