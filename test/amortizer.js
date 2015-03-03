var Promise = require('bluebird').Promise;

Promise.longStackTraces();
var nconf      = require('../lib/config');
nconf.set('db:connection:filename', ':memory:');

var db         = require('../lib/db');

var uuid       = require('uuid');
var path       = require('path');
var Token      = require(path.join(__dirname, '/../models/token')).model;
var amortizer  = require(path.join(__dirname, '/../lib/amortizer'));
var assert     = require('assert');

describe('Amortizer', function() {
  var token, startTime, startBalance;

  before(function() {
    return db.knex.migrate.rollback(db.conf);
  });

  beforeEach(function() {
    return db.knex.migrate.latest(db.conf).then(function() {
      startTime = Date.now();
      startBalance = 10;
      amortizer._instances[token] = {
        lastCheckedBalance: startBalance,
        lastChargedTime: startTime
      }
      return new Token({ token: uuid.v4() }).save().then(function(token_) {
        token = token_;
        startTime = Date.now();
        amortizer._instances[token.get('token')] = {
          lastCheckedBalance: 10,
          lastChargedTime: startTime
        }
        return token.getBalance().then(function(balance) {
          balance.credit(10);
        });
      });
    });
  });

  afterEach(function() {
    return token.destroy().then(function() {
      return db.knex.migrate.rollback(db.conf);
    });
  });

  it('should check a token\'s balance from the database', function() {
    return new Token({ token: uuid.v4() }).save().then(function(token_) {
      return amortizer.checkTokenBalance(token_).then(function(balance) {
        assert.strictEqual(balance, 0);
      })
      .then(function() {
        return token_.destroy();
      });
    });
  });

  it('should calculate the amount to charge a running instance', function() {
    var charge = amortizer.calculateCharge(token);
    assert(charge <= Math.ceil((Date.now() - startTime) / 100));
  });

  it('should charge a running instance\'s balance', function() {
    return Promise.delay(10).then(function() {
      return amortizer.chargeToken(token).then(function(balance) {
        assert(startBalance - Math.ceil((Date.now() - startTime) / 100) <= balance);
        startBalance = balance;
      });
    });
  });

  it('should check a running instance\'s current balance', function() {
    return Promise.delay(10).then(function() {
      return amortizer.checkTokenBalance(token).then(function(balance) {
        assert(startBalance - Math.ceil((Date.now() - startTime) / 100) <= balance);
      });
    });
  });
});
