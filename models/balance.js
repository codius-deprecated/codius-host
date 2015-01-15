var bookshelf = require('../lib/db').bookshelf;

var Token = require('./token');

var Balance = bookshelf.Model.extend({
  tableName: 'balances',
  defaults: {
    balance: 0
  },
  tokens: function () {
    return this.belongsTo(Token.model);
  }
});

exports.model = Balance;
