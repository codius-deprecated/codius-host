var bookshelf = require('../lib/db').bookshelf;

var Token = require('./token').model;

var Contract = bookshelf.Model.extend({
  tableName: 'contracts',
  tokens: function () {
    return this.hasMany(Token);
  }
});

exports.model = Contract;
