var Contract = require('../models/contract').model;
var ContractStorageEntry = require('../models/contract_storage_entry').model;

exports.getItem = getItem;
exports.setItem = setItem;
exports.removeItem = removeItem;
exports.clear = clear;
exports.key = key;

function getItem(contractHash, key, callback) {
	new Contract({ hash: contractHash }).load({ contractStorageEntries: function(qb) {
		qb.where('contractStorageEntries.key', '=', key);
	}}).then(function(contract){
		console.log(contract);
		if (contract.related('contractStorageEntries')) {
			callback(null, contract.related('contractStorageEntries').value);
		}
	}).otherwise(callback);
}

function setItem(contractHash, key, value, callback) {
	var item = {
		key: key,
		value: value
	};

	new Contract({ hash: contractHash }).then(function(contract){
		return contract.related('contractStorageEntries').create(item);
	}).then(function(){
		callback();
	}).otherwise(callback);
}

function removeItem(contractHash, key, callback) {

}

function clear(contractHash, callback) {

}

function key(contractHash, index, callback) {

}
