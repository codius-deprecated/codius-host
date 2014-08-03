var bookshelf = require('../lib/db').bookshelf;

var Token = require('./token').model;

var Balance = bookshelf.Model.extend({
  tableName: 'balances',
  tokens: function () {
    return this.hasMany(Token);
  }
});

exports.model = Balance;
