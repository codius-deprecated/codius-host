var Balance = require(__dirname+'/../../models/balance').model;
var assert  = require('assert');

describe('Balance', function() {

  it('should have an amount of zero', function(done) {
    new Balance().save().then(function(balance) {
      assert.strictEqual(balance.get('balance'), 0);
      done();
    });
  });
});

