var bookshelf = require('../lib/db').bookshelf;

var Token = require('./token');

var Contract = bookshelf.Model.extend({
  tableName: 'contracts',
  tokens: function () {
    return this.hasMany(Token.model);
  }
});

exports.model = Contract;
