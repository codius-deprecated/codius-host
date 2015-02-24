var CodiusHost = require(__dirname+'/../');
var express    = require('express');
var sinon      = require('sinon');
var assert     = require('assert');
var supertest  = require('supertest');
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

  it('should expose a health check route', function(done) {
    http
      .get('/health')
      .expect(200)
      .end(function(error, response) {
        assert.strictEqual(response.statusCode, 200);
        done();
      });
  });

  it('should expose a token generation route', function(done) {
    var contractHash = '427c7a0bfa92621f93fac7ed35e42a6d4fc4fef522b89ade12776367399014ef';
    new Contract({hash: contractHash}).save().then(function (contract) {
      http
        .post('/token?contract='+contractHash)
        .expect(200)
        .end(function(error, response) {
          assert.strictEqual(response.statusCode, 200);
          token = response.body.token;
          contract.destroy().then(function() {
            done();
          });
        });
    })
  });

  it('should expose a contract metadata route', function(done) {
    http
      .get('/token/'+token)
      .expect(200)
      .end(function(error, response) {
        assert.strictEqual(response.statusCode, 200);
        done();
      });
  });

  it.skip('should not upload an empty contract', function(done) {
    http
      .post('/contract')
      .end(function(error, response) {
        assert.strictEqual(response.body.success, false);
        assert.strictEqual(response.body.error, 'no contract provided');
        assert.strictEqual(response.body.statusCode, 500);
        done();
      });
  });
});

