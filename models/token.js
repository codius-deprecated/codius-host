var bookshelf = require('../lib/db').bookshelf;
var Balance   = require(__dirname+'/balance').model;
var Contract  = require(__dirname+'/contract').model;
var Promise   = require('bluebird');

var Token = bookshelf.Model.extend({
  initialize: function() {
    this.on('created', this.attachBalance);
  },
  tableName: 'tokens',
  balance: function () {
    return this.hasOne(Balance);
  },
  contract: function () {
    return this.belongsTo(Contract);
  },
  attachBalance: function() {
    var this_ = this;
    return new Balance({ token_id: this.get('id') })
      .save()
      .then(function(balance) {
        this_.set('balance_id', balance.get('id'));
        return this_.save();
      });
  },
  getBalance: function() {
    return new Balance({ token_id: this.get('id') }).fetch()
      .then(function(balance) {
        if (!balance) {
          return Promise.reject(new Error('balance not found'));
        }
        return Promise.resolve(balance);
      })
  }
});

exports.model = Token;
