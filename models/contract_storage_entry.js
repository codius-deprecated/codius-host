var bookshelf = require('../lib/db').bookshelf;

var Contract = require('./contract');

var ContractStorageEntry = bookshelf.Model.extend({
  tableName: 'contract_storage_entries',
  contract: function () {
    return this.belongsTo(Contract.model);
  }
});

exports.model = ContractStorageEntry;
