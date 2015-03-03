var Promise = require('bluebird').Promise;

Promise.longStackTraces();
var nconf      = require('../lib/config');
nconf.set('db:connection:filename', ':memory:');

var db         = require('../lib/db');

var path            = require('path');
var Token           = require(path.join(__dirname, '/../models/token')).model;
var BillingService  = require(path.join(__dirname, '/../lib/billing_service'));
var assert          = require('assert');

describe('Billing Service', function() {
  var token, billing;

  before(function() {
    return db.knex.migrate.rollback(db.conf);
  });

  beforeEach(function() {
    return db.knex.migrate.latest(db.conf).then(function() {
      billing = new BillingService();
      return new Token().save().then(function(token_) {
        token = token_;
      });
    });
  });

  afterEach(function() {
    return db.knex.migrate.rollback(db.conf);
  });

  it('should credit the token with a positive balance', function() {

    return billing.credit(token, 250).then(function(credit) {
      assert.strictEqual(credit.get('amount'), 250);

      return token.getBalance().then(function(balance) {
        assert.strictEqual(balance.get('balance'), credit.get('amount'));
      });
    });
  });

  it('should charge the balance of a token', function() {
    return billing.credit(token, 100).then(function() {
      return billing.debit(token, 11.235).then(function(debit) {
        assert.strictEqual(debit.get('amount'), 11.235);
      })
    });
  })

  it('should subtract from a balance upon debit', function() {
    var amount;
    var debitAmount = 3.33;

    return billing.getBalance(token).then(function(balance) {
      amount = balance.get('balance');

      return balance.debit(debitAmount).then(function(debit) {
        assert.strictEqual(debit.get('amount'), debitAmount);
        assert.strictEqual(balance.get('amount', amount - debitAmount));
      });
    });
  });

  it('should add to a balance upon credit', function() {
    var amount;
    var creditAmount = 5;

    return billing.getBalance(token).then(function(balance) {
      amount = balance.get('balance');

      return balance.credit(creditAmount).then(function(credit) {
        assert.strictEqual(credit.get('amount'), creditAmount);

        return balance.refresh().then(function(balance) {
          assert.strictEqual(balance.get('balance'), amount + creditAmount);
        });
      });
    });
  });

  it('should prevent overdrafts, draining the balance', function() {
    var insaneAmount = 999999999999;

    return billing.credit(token, 100).then(function() {
      return billing.getBalance(token).then(function(balance) {
        return billing.debit(token, insaneAmount)
        .catch(BillingService.Overdraft, function(overdraft) {
          assert.strictEqual(overdraft.debit.get('amount')  , balance.get('balance'));
          assert.strictEqual(overdraft.remainder, insaneAmount - balance.get('balance'));

          return balance.refresh().then(function(balance) {
            assert.strictEqual(balance.get('balance'), 0);
          });
        });
      });
    });
  });

  it('should have many debits per balance', function() {
    return billing.credit(token, 1000).then(function() {
      return billing.debit(token, 100).then(function() {
        return billing.getDebits(token).then(function(debits) {
          assert(debits.length > 0);
        });
      });
    });
  });

  it('should have many credits per balance', function() {
    return billing.credit(token, 100).then(function() {
      return billing.getCredits(token).then(function(credits) {
        assert(credits.length > 0);
      });
    });
  });
});

