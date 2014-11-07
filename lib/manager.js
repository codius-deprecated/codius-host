var winston = require('winston');
var chalk = require('chalk');

var formatter = require('./formatter');
var engine = require('./engine');
var config = require('./config');

var Token = require('../models/token').model;

var uniqueRunId = 0;

var runningInstances = exports._runningInstances = {};

exports.handleConnection = function (token, stream) {
  var runId = uniqueRunId++;

  new Token({token: token}).fetch({withRelated: ['contract']}).then(function (token) {
    if (!token) {
      // TODO: Handle error somehow
    } else {
      var contractHash = token.related('contract').get('hash');
      var contractToken = token.get('token');

      var contractIdent = formatter.hash(contractHash) + chalk.dim(':' + runId);

      winston.debug(contractIdent, chalk.dim('+++'), 'Incoming connection');

      // Start the contract if there is no currently running instance yet
      var runner = runningInstances[contractToken];
      if (!runner) {
        runner = runningInstances[contractToken] = engine.engine.runContract(contractHash);

        runner.on('exit', function (code, signal) {
          delete runningInstances[contractToken];
        });
      }

      var listener;
      if (listener = runner.getPortListener(engine.engineConfig.virtual_port)) {
        listener(stream);
      } else {
        function handleListener(event) {
          if (event.port !== engine.engineConfig.virtual_port) return;

          runner.removeListener('portListener', handleListener);

          // Pass socket stream to contract
          event.listener(stream);
        }
        runner.on('portListener', handleListener);
      }

      // TODO: Why does this not get triggered?
      stream.on('end', function () {
        winston.debug(contractIdent, chalk.dim('---'), 'Connection ended');
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
