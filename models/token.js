var bookshelf = require('../lib/db').bookshelf;

var Balance = require('./balance').model;
var Contract = require('./contract').model;

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
    return new Balance().save()
      .then(function(balance) {
        this_.set('balance_id', balance.get('id'));
        return this_.save();
      });
  }
});

exports.model = Token;
