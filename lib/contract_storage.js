//------------------------------------------------------------------------------
/*
    This file is part of Codius: https://github.com/codius
    Copyright (c) 2014 Ripple Labs Inc.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose  with  or without fee is hereby granted, provided that the above
    copyright notice and this permission notice appear in all copies.

    THE  SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
    WITH  REGARD  TO  THIS  SOFTWARE  INCLUDING  ALL  IMPLIED  WARRANTIES  OF
    MERCHANTABILITY  AND  FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
    ANY  SPECIAL ,  DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
    WHATSOEVER  RESULTING  FROM  LOSS  OF USE, DATA OR PROFITS, WHETHER IN AN
    ACTION  OF  CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
    OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/
//==============================================================================

var Contract = require('../models/contract').model;
var ContractStorageEntry = require('../models/contract_storage_entry').model;

exports.getItem = getItem;
exports.setItem = setItem;
exports.removeItem = removeItem;
exports.clear = clear;
exports.key = key;

function getItem(contractHash, key, callback) {
  new Contract({ hash: contractHash }).fetch().then(function (contract) {
    if (!contract) {
      throw new Error('Unknown contract hash');
    }

    return new ContractStorageEntry({key: key, contract_id: contract.id}).fetch();
  }).then(function (entry) {
    if (!entry) {
      callback(null, void(0));
      return;
    }

    callback(null, entry.get('value'));
  }).catch(callback);
}

function setItem(contractHash, key, value, callback) {
	var contract;
  new Contract({ hash: contractHash }).fetch().then(function (contract_) {
		contract = contract_;

    if (!contract) {
      throw new Error('Unknown contract hash');
    }

		return new ContractStorageEntry({key: key, contract_id: contract.id}).fetch();
	}).then(function (entry) {
		if (!entry) {
			return new ContractStorageEntry({key: key, value: value, contract_id: contract.id}).save();
		} else {
      return entry.save({value: value});
		}
  }).then(function () {
    callback();
  }).catch(callback);
}

function removeItem(contractHash, key, callback) {
  callback(new Error('contract_storage: removeItem is not implemented!'));
}

function clear(contractHash, callback) {
  callback(new Error('contract_storage: clear is not implemented!'));
}

function key(contractHash, index, callback) {
  callback(new Error('contract_storage: key is not implemented!'));
}
