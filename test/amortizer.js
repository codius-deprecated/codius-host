var uuid       = require('uuid');
var path       = require('path');
var Token      = require(path.join(__dirname, '/../models/token')).model;
var Amortizer  = require(path.join(__dirname, '/../lib/amortizer')).Amortizer;
var assert     = require('assert');

describe('Amortizer', function() {
  var amortizer, token, startTime, startBalance;

  before(function(done) {
    amortizer = new Amortizer({
      pollInterval: 100,
      millisecondsPerComputeUnit: 100
    });
    amortizer.stopPollingRunningInstances();
    startTime = Date.now();
    startBalance = 10;
    amortizer._instances[token] = {
      lastCheckedBalance: startBalance,
      lastChargedTime: startTime
    }
    new Token({ token: uuid.v4() }).save().then(function(token_) {
      token = token_;
      startTime = Date.now();
      amortizer._instances[token.get('token')] = {
        lastCheckedBalance: 10,
        lastChargedTime: startTime
      }
      token.getBalance().then(function(balance) {
        balance.credit(10);
        done();
      });
    });
  });

  after(function(done) {
    token.destroy().then(function() {
      done();
    });
  });

  it('should check a token\'s balance from the database', function(done) {
    new Token({ token: uuid.v4() }).save().then(function(token_) {
      amortizer.checkTokenBalance(token_.get('token')).then(function(balance) {
        assert.strictEqual(balance, 0);
      })
      .then(function() {
        token_.destroy().then(function() {
          done();
        });
      });
    });
  });

  it('should calculate the amount to charge a running instance', function(done) {

    var charge = amortizer.calculateCharge(token.get('token'));
    assert(charge <= Math.ceil((Date.now() - startTime) / 100));
    done();
  });

  it('should charge a running instance\'s balance', function(done) {

    amortizer.chargeToken(token.get('token')).then(function(balance) {
      assert(startBalance - Math.ceil((Date.now() - startTime) / 100) <= balance);
      startBalance = balance;
      done();
    });
  });

  it('should check a running instance\'s current balance', function(done) {

    amortizer.checkTokenBalance(token.get('token')).then(function(balance) {
      assert(startBalance - Math.ceil((Date.now() - startTime) / 100) <= balance);
      done();
    });
  });
});
