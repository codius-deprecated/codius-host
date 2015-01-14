var tokenLib = require('../lib/token');

var Token = require('../models/token').model;
var Contract = require('../models/contract').model;
var Balance = require('../models/balance').model;

/**
 * Request a token.
 *
 * A token is a multi-use endpoint for interacting with a contract via HTTP.
 */
module.exports = function (req, res) {
  var config = req.app.get('config');

  function getUniqueToken() {
    var token = tokenLib.generateToken();

    return new Token({token: token}).fetch().then(function (model) {
      if (model !== null) {
        return getUniqueToken();
      } else return token;
    });
  }

  // First we check if the contract actually exists
  new Contract({hash: req.query.contract}).fetch().then(function (contract) {
    if (!contract) {
      // Contract doesn't exist
      res.status(400).json({
        message: "Unknown contract hash"
      });
    } else {
      // TODO: clean up this mess of returns
      return getUniqueToken().then(function (token) {
        return Token.forge({token: token, contract_id: contract.get('id')}).save().then(function(token){
          return Balance.forge({token_id: token.get('id'), balance: 0}).save().then(function(){
            return token;
          });
        });
      }).then(function (token) {
        // All done!
        res.status(200).json({
          token: token.get('token')
        });
      });
    }
  });
};
