var Balance = require(__dirname+'/../../models/balance').model; var assert  = require('assert');

describe('Balance Model', function() {
  var balance

  before(function(done) {
    new Balance().save().then(function(record) {
      balance = record;
      done();
    });
  });

  after(function(done) {
    balance.destroy().then(function() {
      done();
    });
  });

  it('should have an amount of zero', function() {
    assert.strictEqual(balance.get('balance'), 0);
  });

  it('should increase the balance with a credit', function(done) {

    balance.credit(5500).then(function() {
      balance.refresh().then(function(balance) {
        assert.strictEqual(balance.get('balance'), 5500);
        done();
      })
    });
  });

  it('should return a record of the credit', function(done) {
    balance.credit(5500).then(function(credit) {
      assert.strictEqual(credit.get('amount'),   5500);

      balance.refresh().then(function(balance) {
        assert.strictEqual(balance.get('balance'), 11000);
        done();
      });
    });
  });

  it('should reduce the balance with a debit', function(done) {
    balance.debit(100).then(function(debit) {
      assert.strictEqual(debit.get('amount'), 100);

      balance.refresh().then(function(balance) {
        assert.strictEqual(balance.get('balance'), 10900);
        done();
      });
    });
  });
});

