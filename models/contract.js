var bookshelf = require('../lib/db').bookshelf;

var Token = require('./token');
var ContractStorageEntry = require('./contract_storage_entry');

var Contract = bookshelf.Model.extend({
  tableName: 'contracts',
  tokens: function () {
    return this.hasMany(Token.model);
  },
  contractStorageEntries: function () {
  	return this.hasMany(ContractStorageEntry.model);
  }
});

exports.model = Contract;
