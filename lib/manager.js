var winston = require('winston');
var chalk = require('chalk');
var Promise = require('bluebird');

var formatter = require('./formatter');
var engine = require('./engine');
var config = require('./config');

var Token = require('../models/token').model;

/**
 * Class that handles incoming connections and
 * bills tokens for their running time
 *
 * @param {Integer} opts.pollInterval
 * @param {Integer} opts.millisecondsPerComputeUnit
 */
function Manager (opts) {
  var self = this;

  if (!opts) {
    opts = {};
  }

  self._uniqueRunId = 0;
  self._runningInstances = {};
  self._pollInterval = opts.pollInterval || 100;
  self._millisecondsPerComputeUnit = opts.millisecondsPerComputeUnit || 100;
  self._minBalance = Math.ceil(self._pollInterval / self._millisecondsPerComputeUnit);
  self._polling = false;

  self.startPollingRunningInstances();
}

/**
 * Pass the incoming stream either to an existing contract instance
 * or create a new instance if there isn't one already and the token
 * has more than the minimum balance
 */
Manager.prototype.handleConnection = function (token, stream) {
  var self = this;

  var runId = self._uniqueRunId++;

  // TODO: handle the error created when the stream is closed
  // because the contract is killed due to a low balance
  stream.on('error', function(error){
    winston.debug(contractIdent, chalk.dim('+++'), 'Stream error: ' + error.message);
  });

  new Token({token: token}).fetch({withRelated: ['contract', 'balance']}).then(function (model) {
    if (!model) {
      // TODO: Handle error somehow
    } else {
      var contractHash = model.related('contract').get('hash');
      var contractToken = model.get('token');
      var tokenBalance = model.related('balance').get('balance');

      var contractIdent = formatter.hash(contractHash) + chalk.dim(':' + runId);

      winston.debug(contractIdent, chalk.dim('+++'), 'Incoming connection');

      // Start the contract if there is no currently running instance yet
      var runner = self._runningInstances[contractToken];
      if (!runner && tokenBalance > self._minBalance) {
        runner = engine.engine.runContract(contractHash);

        // TODO: modify the engine and sandbox to make this work
        // runner._sandbox.pipeStdout({
        //   write: function (output) {
        //     // TODO Redirect to a stream that clients can subscribe to
        //     winston.debug(contractIdent, chalk.dim('...'),output.replace(/\n$/, ''));
        //   }
        // });
        self._runningInstances[contractToken] = {
          runner: runner,
          lastCheckedBalance: tokenBalance,
          lastChargedTime: Date.now()
        };

        // If the contract exits by itself, update its balance
        // and then remove it from the runningInstances array
        runner.on('exit', function (code, signal) {
          self.chargeToken(contractToken).then(function(){
            delete self._runningInstances[contractToken];
          });
        });
      }

      // This means there was an insufficient balance to start the contract
      if (!runner) {
        // TODO: handle this error case
        winston.debug(contractIdent, chalk.dim('+++'), 'Insufficient balance in token "'+token+'" to start contract');
        return;
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
    }
  });
};

/**
 * Start the recursive pollRunningInstances loop
 */
Manager.prototype.startPollingRunningInstances = function(){
  var self = this;
  self._polling = true;
  self.pollRunningInstances();
};

/**
 * Check each of the active tokens to determine if their balances are
 * running low. If one appears to have a balance less than the minimum,
 * check the database again to see if it has been refilled since the last
 * check and charge the token for its time used. If the balance is still
 * too low, then kill the instance
 */
Manager.prototype.pollRunningInstances = function(){
  var self = this;
  if (!self._polling) {
    return;
  }

  var activeTokens = Object.keys(self._runningInstances);
  return Promise.each(activeTokens, function(token){
    var instance = self._runningInstances[token];
    // Note that we don't check the balance every time
    // to avoid unnecessary database reads
    if (instance.lastCheckedBalance - self.calculateCharge(token) <= self._minBalance) {
      self.chargeToken(token).then(function(newBalance){
        if (newBalance < self._minBalance) {
          instance.runner.kill();
          winston.debug('Killed token "' + token + '"');
          delete instance;
        }
      });
    }
  }).delay(self._pollInterval).then(self.pollRunningInstances.bind(self));
};

/**
 * Charge is based on the cost per millisecond, which is set by the host
 */
Manager.prototype.calculateCharge = function(token) {
  var self = this;
  var instance = self._runningInstances[token];
  var runTime = Date.now() - instance.lastChargedTime;
  var charge = Math.ceil(runTime / self._millisecondsPerComputeUnit);
  return charge;
};

/**
 * Calculate the amount owed since the lastChargedTime and apply the charge
 */
Manager.prototype.chargeToken = function(token) {
  var self = this;
  return self.checkTokenBalance(token).then(function(balance){
    return balance - self.calculateCharge(token);
  }).then(function(newBalance){
    return new Token({token: token}).fetch({
      withRelated: ['balance']
    }).then(function(model){
      var bal = model.related('balance');
      bal.set({
        balance: newBalance
      });
      return bal.save();
    });
  }).then(function(model){
    return model.get('balance');
  }).then(function(newBalance){
    self._runningInstances[token].lastChargedTime = Date.now();
    self._runningInstances[token].lastCheckedBalance = newBalance;
    return newBalance;
  });
};

Manager.prototype.stopPollingRunningInstances = function(){
  var self = this;
  self._polling = false;
};

/**
 * Read the token's current balance from the database
 * and also update the entry in the runningInstances map
 */
Manager.prototype.checkTokenBalance = function(token) {
  var self = this;
  return new Token({token: token}).fetch({
    withRelated: ['balance']
  }).then(function(model){
    var balance = model.related('balance').get('balance');
    self._runningInstances[token].lastCheckedBalance = balance;
    return balance;
  });
};

exports.Manager = Manager;
