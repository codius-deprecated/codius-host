var CodiusHost = require(__dirname+'/../');
var express    = require('express');
var sinon      = require('sinon');
var assert     = require('assert');
var supertest  = require('supertest-as-promised');
var Contract   = require(__dirname+'/../models/contract').model;

describe('Codius Host Express Application', function() {
  var application, http, token;

  before(function() {
    application = new CodiusHost.Application();
    http        = supertest(application);
  })

  it('should initialize an express application', function() {
    assert.strictEqual(typeof application.listen, 'function');
  });

  it('should expose a health check route', function() {
    return http
      .get('/health')
      .expect(200);
  });

  it('should expose a token generation route', function() {
    var contractHash = '427c7a0bfa92621f93fac7ed35e42a6d4fc4fef522b89ade12776367399014ef';
    return new Contract({hash: contractHash}).save().then(function (contract) {
      return http
        .post('/token?contract='+contractHash)
        .expect(200)
        .then(function(response) {
          token = response.body.token;
          return contract.destroy();
        });
    })
  });

  it('should expose a contract metadata route', function() {
    return http
      .get('/token/'+token)
      .expect(200);
  });

  it.skip('should not upload an empty contract', function() {
    return http
      .post('/contract')
      .expect(500)
      .then(function(response) {
        assert.strictEqual(response.body.success, false);
        assert.strictEqual(response.body.error, 'no contract provided');
      });
  });
});

