var bookshelf = require('../lib/db').bookshelf;

var Token   = require('./token').model;
var Credit  = require('./credit').model;
var Debit   = require('./debit').model;
var Promise = require('bluebird');

var Balance = bookshelf.Model.extend({
  tableName: 'balances',
  defaults: {
    balance: 0
  },
  tokens: function () {
    return this.belongsTo(Token);
  },
  debits: function() {
    return this.hasMany(Debit);
  },
  credits: function() {
    return this.hasMany(Credit);
  },
  credit: function(amount) {
    return Credit.creditBalance(this, amount)
  },
  debit: function(amount) {
    return Debit.debitBalance(this, amount);
  },
  refresh: function() {
    return new Balance({ id: this.get('id') }).fetch()
  }
});

exports.model = Balance;
