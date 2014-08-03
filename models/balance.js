var bookshelf = require('../lib/db').bookshelf;

var Token = require('./token');

var Balance = bookshelf.Model.extend({
  tableName: 'balances',
  tokens: function () {
    return this.hasMany(Token.model);
  }
});

exports.model = Balance;
