var uuid      = require('uuid')
var Promise   = require('bluebird')
var codius    = require(__dirname+'/../../')
var assert    = require('assert')
var expect    = require('chai').expect;
var supertest = require('supertest-as-promised')
var Server    = require(__dirname+'/../../billing-service/server');

describe('Billing Service HTTP Interface', function() {
  var token, server, http;

  before(function() {
    return new codius.Token({ token: uuid.v4() }).save()
      .then(function(model) {
        token = model
      })
  })

  beforeEach(function() {
    server = Server(codius);
    http = supertest(server);
  });

  it('should credit a token balance', function() {
    var url = '/contracts/'+token.get('token')+'/credits'
    return http
      .post(url)
      .send({ amount: 100 })
      .expect(200)
      .then(function(response) {
        return expect(getBalance(token)).to.eventually.equal(100);
      });
  })

  it('should debit a token balance', function() {
    return http
      .post('/contracts/'+token.get('token')+'/debits')
      .send({ amount: 50 })
      .expect(200)
      .then(function(response) {
        return expect(getBalance(token)).to.eventually.equal(50);
      });
  })

  it('should overdraft with an error', function() {
    return http
      .post('/contracts/'+token.get('token')+'/debits')
      .send({ amount: 75 })
      .expect(500)
      .then(function(response) {
        assert.strictEqual(response.body.error, 'overdraft')
        return expect(getBalance(token)).to.eventually.equal(0);
      });
  })

  function getBalance(token) {
    return http.get('/contracts/'+token.get('token'))
      .then(function(response) {
        return response.body.balance
      })
  }
})
