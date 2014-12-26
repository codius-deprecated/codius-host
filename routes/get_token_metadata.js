var Token = require('../models/token').model;
var Bitcoin = require('../lib/bitcoin');
var config = require('../lib/config');

module.exports = function(manager, req, res, next) {

  var token = req.params.token;
  if (!token) {
    res.status(400).json({
      message: "Must supply contract token to retrieve metadata"
    });
    return;
  }

  new Token({token: token}).fetch({
    withRelated: ['balance']
  }).then(function (model) {
    if (!model) {
      res.status(404).json({
        message: "Token not found"
      });
      return;
    } else {
      manager.checkTokenBalance(token).then(function(balance){
        res.status(200).json({
          token: token,
          compute_units: balance,
          bitcoin_address: Bitcoin.generateDeterministicWallet(model.related('balance').id),
          compute_units_per_bitcoin: config.get('compute_units_per_bitcoin')
        });
      });
    }
  });

};
