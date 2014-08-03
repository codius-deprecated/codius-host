var winston = require('winston');
var chalk = require('chalk');

var formatter = require('../lib/formatter');

var Token = require('../models/token').model;

var uniqueRunId = 0;

/**
 * Run a contract.
 */
module.exports = function (req, res, next) {
  var token = req.params.token;
  var runId = uniqueRunId++;

  new Token({token: token}).fetch({withRelated: ['contract']}).then(function (token) {
    if (!token) {
      res.send(404);
    } else {
      var contractHash = token.related('contract').get('hash');
      var engine = req.app.get('engine');

      var contractIdent = formatter.hash(contractHash) + chalk.dim(':' + runId);

      winston.debug(contractIdent, chalk.dim('+++'), chalk.bold(req.method + ' ' + req.url));

      var runner = engine.runContract(contractHash, '', function (error, result) {
        winston.debug(contractIdent, chalk.dim('---'), chalk.green("204 No Content"), chalk.dim('(0 bytes)'));
        res.send(204);
      });

      runner._sandbox._stdout = {
        write: function (output) {
          // TODO Redirect to a stream that clients can subscribe to
          winston.debug(contractIdent, chalk.dim('...'),output.replace(/\n$/, ''));
        }
      };
    }
  });
};
