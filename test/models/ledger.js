var Ledger = require(__dirname+'/../../models/ledger').model;
var Token = require(__dirname+'/../../models/token').model;
var assert  = require('assert');

describe('Ledger Model', function() {
  var ledger, token;

  before(function(done) {
    Ledger.findOrCreate({ name: 'bitcoin' }).then(function(record) {
      ledger = record;
      new Token().save().then(function(record) {
        token = record;
        done();
      }) 
    })
  });

  it('should register an address in the ledger', function(done) {
    ledger.registerAddress(token, 'someAddress')
      .then(function(address) {
        assert.strictEqual(address.get('address'), 'someAddress')

        address.related('ledger').fetch().then(function(related) {
          assert.strictEqual(related.get('id'), ledger.get('id'))
          done()
        })
      })
  });

  after(function(done) {
    ledger.destroy().then(function() {
      token.destroy().then(function() {
        done();
      })
    });
  });
});

