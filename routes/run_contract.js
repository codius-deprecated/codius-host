var winston = require('winston');
var chalk = require('chalk');

var formatter = require('../lib/formatter');
var engine = require('../lib/engine');
var config = require('../lib/config');

var Token = require('../models/token').model;

var uniqueRunId = 0;

/**
 * Run a contract.
 */
module.exports = function (token, stream) {
  var runId = uniqueRunId++;

  new Token({token: token}).fetch({withRelated: ['contract']}).then(function (token) {
    if (!token) {
      // TODO: Handle error somehow
    } else {
      var contractHash = token.related('contract').get('hash');

      var contractIdent = formatter.hash(contractHash) + chalk.dim(':' + runId);

      winston.debug(contractIdent, chalk.dim('+++'), 'Incoming connection');

      var runner = engine.engine.runContract(contractHash, function (error, result) {
        //winston.debug(contractIdent, chalk.dim('---'), chalk.green("204 No Content"), chalk.dim('(0 bytes)'));
        var listener = runner.getPortListener(config.get('virtual_port'));

        if (!listener) {
          console.log('Contract is not (yet) listening');
        } else {
          // Pass socket stream to contract
          listener(stream);
        }

        // TODO: Why does this not get triggered?
        stream.on('end', function () {
          winston.debug(contractIdent, chalk.dim('---'), 'Connection ended');
        });
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
