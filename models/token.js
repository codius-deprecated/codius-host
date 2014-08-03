var bookshelf = require('../lib/db').bookshelf;

var Balance = require('./balance').model;

var Token = bookshelf.Model.extend({
  tableName: 'tokens',
  balance: function () {
    return this.belongsTo(Balance);
  },
  parent: function () {
    return this.belongsTo(Token);
  },
  children: function () {
    return this.hasMany(Token);
  }
});

exports.model = Token;
