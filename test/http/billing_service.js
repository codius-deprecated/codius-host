var uuid      = require('uuid')
var Promise   = require('bluebird')
var codius    = require(__dirname+'/../../')
var assert    = require('assert')
var supertest = require('supertest')
var server    = require(__dirname+'/../../billing-service/server')(codius)
var http      = supertest(server)

describe('Billing Service HTTP Interface', function() {
  var token

  before(function(done) {
    new codius.Token({ token: uuid.v4() }).save()
      .then(function(model) {
        token = model
        done()
      })
  })

  it('should credit a token balance', function(done) {
    var url = '/contracts/'+token.get('token')+'/credits'
    http
      .post(url)
      .send({ amount: 100 })
      .end(function(error, response) {
        assert(response.body.success)
        getBalance(token).then(function(balance) {
          assert.strictEqual(balance, 100)
          done()
        })
      })
  })

  it('should debit a token balance', function(done) {
    http
      .post('/contracts/'+token.get('token')+'/debits')
      .send({ amount: 50 })
      .end(function(error, response) {
        assert(response.body.success)
        getBalance(token).then(function(balance) {
          assert.strictEqual(balance, 50)
          done()
        })
      })
  })

  it('should overdraft with an error', function(done) {
    http
      .post('/contracts/'+token.get('token')+'/debits')
      .send({ amount: 75 })
      .end(function(error, response) {
        assert(!response.body.success)
        assert.strictEqual(response.body.error, 'overdraft')
        getBalance(token).then(function(balance) {
          assert.strictEqual(balance, 0)
          done()
        })
      })
  })

  function getBalance(token) {
    return new Promise(function(resolve, reject) {
      http.get('/contracts/'+token.get('token'))
        .end(function(error, response) {
          if (error) { return reject(error) }
          resolve(response.body.balance)
        })
    })
  }
})
