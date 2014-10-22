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

      var runner = engine.engine.runContract(contractHash);

      runner.on('portListener', function (event) {
        if (event.port !== config.get('virtual_port')) return;

        // Pass socket stream to contract
        event.listener(stream);

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
