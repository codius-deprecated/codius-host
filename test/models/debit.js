var path     = require('path');
var Credit   = require(path.join(__dirname, '/../../models/credit')).model;
var Debit    = require(path.join(__dirname, '/../../models/debit')).model;
var Token    = require(path.join(__dirname, '/../../models/token')).model;
var Balance  = require(path.join(__dirname, '/../../models/balance')).model;
var assert   = require('assert');

describe('Debit Model', function() {
  var token, balance;

  before(function(done) {
    new Token().save().then(function(_token) {
      token = _token;
      done();
    });
  });

  it('should subtract from a balance', function(done) {

    token.getBalance().then(function(balance) {

      balance.credit(5).then(function() {
        Debit.debitBalance(balance, 1).then(function(debit) {
          assert.strictEqual(debit.get('amount'), 1);
          balance.refresh().then(function(balance) {
            assert.strictEqual(balance.get('balance'), 4);
            done();
          });
        });
      });
    });
  });

  it('should reject with a negative amount', function(done) {

    new Debit({ amount: -5 }).save().error(function(error) {
      assert(error);
      assert.strictEqual(error.message, 'amount must be greater than zero');
      done();
    });
  });

  it('should reject with an empty amount', function(done) {

    new Debit().save().error(function(error) {
      assert(error);
      assert.strictEqual(error.message, 'amount must be greater than zero');
      done();
    });
  });
});

