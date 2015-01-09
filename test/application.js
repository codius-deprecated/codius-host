var CodiusHost = require(__dirname+'/../');
var express    = require('express');
var sinon      = require('sinon');
var assert     = require('assert');
var supertest  = require('supertest');

describe('Codius Host Express Application', function() {
  var application, http;

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

