var path       = require('path');
var Token      = require(path.join(__dirname, '/../models/token')).model;
var amortizer  = require(path.join(__dirname, '/../lib/amortizer'));
var features   = require(path.join(__dirname, '/../lib/features'));
var request    = require('request')
var _          = require('lodash')

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
      var metadata = {
        token: token,
        hash: model.related('contract').get('hash')
      }
      amortizer.checkTokenBalance(model).then(function(balance){
        metadata.compute_units = balance;
        model.related('addresses').fetch({ withRelated: ['ledger'] }).then(function(addresses) {
          if (addresses.models.length > 0) {
            metadata.payment_addresses = _.map(addresses.models, function(address) {
              return address.related('ledger').get('name')+':'+address.get('address')
            })
          }
          var getInstanceUrl = 'http://127.0.0.1:' + ((parseInt(process.env.PORT) || 5000) + 30) + '/instances/' + token;
          request.get(getInstanceUrl, function(err, result, body) {
            if (!err && result.statusCode == 200) {
              var instance = JSON.parse(body).instance;
              if (instance && instance.state) {
                metadata.state = instance.state;
              }
            }
            res.status(200).json(metadata);
          })
        });
      })
    }
  });
};
