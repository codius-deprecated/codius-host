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

var bookshelf = require('../lib/db').bookshelf;
var Balance   = require(__dirname+'/balance');
var Contract  = require(__dirname+'/contract');
var events    = require(__dirname+'/../lib/events');
var Promise   = require('bluebird');

var Token = bookshelf.Model.extend({
  initialize: function() {
    this.on('created', this.attachBalance);
    this.on('created', this.emitCreated);
  },
  tableName: 'tokens',
  balance: function () {
    return this.hasOne(Balance.model);
  },
  addresses: function() {
    return this.hasMany(Token.model);
  },
  contract: function () {
    return this.belongsTo(Contract.model);
  },
  emitCreated: function(token) {
    events.emit('contract:created', token);
  },
  attachBalance: function() {
    var this_ = this;
    return new Balance.model({ token_id: this.get('id') })
      .save()
      .then(function(balance) {
        this_.set('balance_id', balance.get('id'));
        return this_.save();
      });
  },
  getBalance: function() {
    return new Balance.model({ token_id: this.get('id') }).fetch()
      .then(function(balance) {
        if (!balance) {
          return Promise.reject(new Error('balance not found'));
        }
        return Promise.resolve(balance);
      })
  }
});

exports.model = Token;
