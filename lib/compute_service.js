var path      = require('path');
var Promise   = require('bluebird');
var winston   = require('winston');
var chalk     = require('chalk');
var _         = require('underscore');

var formatter = require(path.join(__dirname, 'formatter'));
var engine    = require(path.join(__dirname, 'engine'));
var config    = require(path.join(__dirname, 'config'));
var events    = require(path.join(__dirname, 'events'));
var Contract  = require(path.join(__dirname, '/../models/contract')).model;

/**
 * Class that manages starting and stoping instances
 *
 */
function ComputeService () {
  var self = this;
  
  self._uniqueRunId = 0;
  self._instances = {};  // instance data
}

ComputeService.prototype.startInstance = function(token, container_uri, type, vars, port) {
  var this_ = this;
  return new Promise(function(resolve, reject) {
    ensureToken(token);
    var runId = this_._uniqueRunId++;

    var contractToken = token.get('token');
    if (!(contractToken in this_._instances)) {
      return reject(new Error('Invalid contract token', contractToken));
    } else if (this_._instances[contractToken].state!=='pending') {
      winston.debug(contractIdent, chalk.dim('+++'), 'Contract is already started');
      return reject(new Error('Instance already started'));
    }

    var contractHash = this_._instances[contractToken].container_hash;

    var contractIdent = formatter.hash(contractHash) + chalk.dim(':' + runId);

    winston.debug(contractIdent, chalk.dim('+++'), 'Starting instance');

    var runner = engine.engine.runContract(contractHash);

    // TODO: modify the engine and sandbox to make this work
    // runner._sandbox.pipeStdout({
    //   write: function (output) {
    //     // TODO Redirect to a stream that clients can subscribe to
    //     winston.debug(contractIdent, chalk.dim('...'),output.replace(/\n$/, ''));
    //   }
    // });
    this_._instances[contractToken].runner = runner;
    this_._instances[contractToken].type = type;
    this_._instances[contractToken].state = 'running';
    this_._instances[contractToken].port = port;
    this_._instances[contractToken].container_uri = container_uri;
// TODO: Update engine to assign ip address to instance.        
    // this_._instances[contractToken].ip_address = ip_address;

    events.emit('contract:started', token);
// TODO: Emit 'running' from codius-engine
    // runner.on('running', function() {
    //   this_._instances[contractToken].state = 'running'
    // });

    runner.on('exit', function (code, signal) {
      this_._instances[contractToken].state = 'stopped';
      events.emit('contract:stopped', token);
    });

    return resolve(formatInstance(this_._instances[contractToken], contractToken));
  });
}


ComputeService.prototype.getInstances = function() {
  var this_ = this;
//Should this only return running instances?
  return Promise.resolve(_.map(this_._instances, function(instance, token){
    return formatInstance(instance, token);
  }));
}

ComputeService.prototype.getInstance = function(token) {
  var this_ = this;
  return new Promise(function(resolve, reject) {
    if (!token) { reject(new Error('token must be provided')) }
    var instance = this_._instances[token.get('token')];
    if (!instance) {
      reject (new Error('Invalid instance token'));
    }
    return resolve(formatInstance(instance, token.get('token')));
  })
}

ComputeService.prototype.stopInstance = function(token) {
  var this_ = this;
  if (!token) { Promise.reject(new Error('token must be provided')) }
  var instance = this_._instances[token.get('token')];
  if (!instance || !instance.runner) {
    return Promise.reject (new Error('Invalid instance token'));
  }
  if (instance.state!=='running') {
    return Promise.reject (new Error('Cannot kill non-running instance'));
  }
  instance.state = 'stopping';
  instance.runner.kill();
  return Promise.resolve(instance.state);
}

/**
 * Pass the incoming stream to an existing contract instance
 */
ComputeService.prototype.handleConnection = function (token, stream) {
  var self = this;

  // TODO: handle the error created when the stream is closed
  // because the contract is killed due to a low balance
  stream.on('error', function(error){
    winston.debug(contractIdent, chalk.dim('+++'), 'Stream error: ' + error.message);
  });

  new Token({token: token}).fetch({withRelated: ['contract']}).then(function (model) {
    if (!model) {
      // TODO: Handle error somehow
      winston.debug(contractIdent, chalk.dim('+++'), 'Stream error: token (' + token + ') not found ');
    } else {
      var contractHash = model.related('contract').get('hash');
      var contractToken = model.get('token');

      var contractIdent = formatter.hash(contractHash);

      winston.debug(contractIdent, chalk.dim('+++'), 'Incoming connection');

      var runner;
      if (contractToken in self._instances) {
        runner = self._instances[contractToken].runner;
      }
      if (!runner) {
        winston.debug(contractIdent, chalk.dim('+++'), 'Stream error: contract not found');
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

function ensureToken(token) {
  if (!token) { throw new Error('token must be provided') }
}

// Return the instance minus the contract runner
function formatInstance(instance, token) {
  return _.extend(_.omit(instance, 'runner'), {token:token});
}

module.exports = new ComputeService();
