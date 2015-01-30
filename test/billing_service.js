var path            = require('path');
var Token           = require(path.join(__dirname, '/../models/token')).model;
var BillingService  = require(path.join(__dirname, '/../lib/billing_service'));
var assert          = require('assert');

describe('Billing Service', function() {
  var token, billing;

  before(function(done) {
    billing = new BillingService();
    new Token().save().then(function(token_) {
      token = token_;
      done();
    });
  });

  after(function(done) {
    token.destroy().then(function() {
      done();
    });
  });

  it('should credit the token with a positive balance', function(done) {

    billing.credit(token, 250).then(function(credit) {
      assert.strictEqual(credit.get('amount'), 250);

      token.getBalance().then(function(balance) {
        assert.strictEqual(balance.get('balance'), credit.get('amount'));
        done();
      });
    });
  });

  it('should charge the balance of a token', function(done) {
    
    billing.debit(token, 11.235).then(function(debit) {
      assert.strictEqual(debit.get('amount'), 11.235);
      done();
    })
  })

  it('should subtract from a balance upon debit', function(done) {
    var amount;
    var debitAmount = 3.33;

    billing.getBalance(token).then(function(balance) {
      amount = balance.get('balance');

      balance.debit(debitAmount).then(function(debit) {
        assert.strictEqual(debit.get('amount'), debitAmount);
        assert.strictEqual(balance.get('amount', amount - debitAmount));
        done();
      });
    });
  });

  it('should add to a balance upon credit', function(done) {
    var amount;
    var creditAmount = 5;

    billing.getBalance(token).then(function(balance) {
      amount = balance.get('balance');

      balance.credit(creditAmount).then(function(credit) {
        assert.strictEqual(credit.get('amount'), creditAmount);

        balance.refresh().then(function(balance) {
          assert.strictEqual(balance.get('balance'), amount + creditAmount);
          done();
        });
      });
    });
  });

  it('should prevent overdrafts, draining the balance', function(done) {
    var insaneAmount = 999999999999;

    billing.getBalance(token).then(function(balance) {
      billing.debit(token, insaneAmount)
      .catch(BillingService.Overdraft, function(overdraft) {
        assert.strictEqual(overdraft.debit.get('amount')  , balance.get('balance'));
        assert.strictEqual(overdraft.remainder, insaneAmount - balance.get('balance'));

        balance.refresh().then(function(balance) {
          assert.strictEqual(balance.get('balance'), 0);
          done();
        });
      });
    });
  });

  it('should have many debits per balance', function(done) {
    billing.getDebits(token).then(function(debits) {
      assert(debits.length > 0);
      done();
    });
  });

  it('should have many credits per balance', function(done) {
    billing.getCredits(token).then(function(credits) {
      assert(credits.length > 0);
      done();
    });
  });
});

