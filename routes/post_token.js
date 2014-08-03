var crypto = require('crypto');
var base64url = require('base64url');

/**
 * Request a token.
 *
 * A token is a multi-use endpoint for interacting with a contract via HTTP.
 */
module.exports = function (req, res) {
  var token = base64url(crypto.pseudoRandomBytes(8));

  // TODO: Token uniqueness should be checked

  // TODO: Token needs to be associated with a contract

  res.json(200, {
    token: token
  });
};
