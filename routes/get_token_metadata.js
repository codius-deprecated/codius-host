var Token          = require('../models/token').model;
var Bitcoin        = require('../lib/bitcoin');
var config         = require('../lib/config');
var BillingService = require('../lib/billing_service');
var features       = require('../lib/features');
var _              = require('lodash')

module.exports = function(req, res, next) {

  var token = req.params.token;
  if (!token) {
    res.status(400).json({
      message: "Must supply contract token to retrieve metadata"
    });
    return;
  }

  new Token({token: token}).fetch({
    withRelated: ['balance', 'contract']
  }).then(function (model) {
    if (!model) {
      res.status(404).json({
        message: "Token not found"
      });
      return;
    } else {
      new BillingService().getBalance(model).then(function(balance) {
        var metadata = {
          token: token,
          hash: model.related('contract').get('hash'),
          compute_units: balance.get('balance')
        }
        model.related('addresses').fetch({ withRelated: ['ledger'] }).then(function(addresses) {
          if (addresses.models.length > 0) {
            metadata.payment_addresses = _.map(addresses.models, function(address) {
              return address.related('ledger').get('name')+':'+address.get('address')
            })
          }
          res.status(200).json(metadata);
        })
      })
    }
  });
};
