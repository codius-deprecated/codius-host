var path      = require('path');
var bookshelf = require(path.join(__dirname, '/../lib/db')).bookshelf;
var Promise   = require('bluebird');

var Debit = bookshelf.Model.extend({
  tableName: 'debits',
  initialize: function() {
    this.on('creating', this.validate);
    this.on('created',  this.debitBalance);
  },
  validate: function() {
    if (!(this.get('amount') > 0)) {
      throw new Error('amount must be greater than zero');
    }
  },
  updateBalance: function() {
    return bookshelf.knex('balances')
      .where('id', '=', this.get('balance_id'))
      .decrement('balance', this.get('amount'))
  }
});

Debit.debitBalance = function(balance, amount) {
  var debit;
  return new Debit({
    amount: amount,
    balance_id: balance.get('id')
  })
  .save()
  .then(function(record) {
    debit = record;
    return debit.updateBalance()
  })
  .then(function() {
    return Promise.resolve(debit);
  })
}

exports.model = Debit;

