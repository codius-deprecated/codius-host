var bookshelf = require('../lib/db').bookshelf;
var path      = require('path');
var Promise   = require('bluebird');

var Credit = bookshelf.Model.extend({
  tableName: 'credits',
  initialize: function() {
    this.on('creating', this.validate);
    this.on('created', this.creditBalance);
  },
  validate: function() {
    if (!(this.get('amount') > 0)) {
      throw new Error('amount must be greater than zero');
    }
  },
  balance: function () {
    return this.belongsTo(Balance);
  },
  updateBalance: function() {
    return bookshelf.knex('balances')
      .where('id', '=', this.get('balance_id'))
      .increment('balance', this.get('amount'))
  }
});

Credit.creditBalance = function(balance, amount) {
  var credit;
  return new Credit({
    balance_id: balance.get('id'),
    amount: amount
  })
  .save()
  .then(function(record) {
    credit = record;
    return credit.updateBalance()
  })
  .then(function() {
    return Promise.resolve(credit);
  })
}

exports.model = Credit;

