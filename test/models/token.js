var path    = require('path');
var assert  = require('assert');
var Token   = require(path.join(__dirname+'/../../models/token')).model;

describe('Token Model', function() {
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

  it('should be created with a balance of zero', function(done) {
    token.getBalance().then(function(balance) {
      assert.strictEqual(balance.get('balance'), 0);
      done();
    });
  });
});
