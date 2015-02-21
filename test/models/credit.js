var path     = require('path');
var Credit   = require(path.join(__dirname, '/../../models/credit')).model;
var Token    = require(path.join(__dirname, '/../../models/token')).model;
var assert   = require('assert');

describe('Credit Model', function() {
  var token;

  before(function(done) {
    new Token().save().then(function(_token) {
      token = _token;
      done();
    });
  });

  after(function(done) {
    token.destroy().then(function() {
      done();
    });
  });

  it('should add to a balance', function(done) {

    token.getBalance().then(function(balance) {
      var initialBalance = balance.get('balance');

      Credit.creditBalance(balance, 5).then(function() {
        balance.refresh().then(function(balance) {
          assert.strictEqual(balance.get('balance'), 5);
          done();
        }); 
      })
    });
  });

  it('should reject with a negative amount', function(done) {

    new Credit({ amount: -5 }).save().error(function(error) {
      assert(error);
      assert.strictEqual(error.message, 'amount must be greater than zero');
      done();
    });
  });

  it('should reject with an empty amount', function(done) {

    new Credit().save().error(function(error) {
      assert(error);
      assert.strictEqual(error.message, 'amount must be greater than zero');
      done();
    });
  });
});

