var path    = require('path');
var assert  = require('assert');
var Token   = require(path.join(__dirname+'/../../models/token')).model;
var Balance = require(path.join(__dirname+'/../../models/balance')).model;

describe('Token Model', function() {

  it('should be created with a balance of zero', function(done) {
    new Token().save().then(function(token) {
      assert(token.get('balance_id') > 0);

      token.getBalance().then(function(balance) {
        assert.strictEqual(balance.get('balance'), 0);
        done();
      });
    });
  });
});
