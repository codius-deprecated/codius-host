var path      = require('path');
var Promise   = require('bluebird');
var winston   = require('winston');
var chalk     = require('chalk');

var formatter = require(path.join(__dirname, 'formatter'));
var engine    = require(path.join(__dirname, 'engine'));
var config    = require(path.join(__dirname, 'config'));
var Token     = require(path.join(__dirname, '../models/token')).model;

/**
 * Class that manages starting and stoping instances
 *
 */
function ComputeService () {
  var self = this;
  
  self._uniqueRunId = 0;
  self._runningInstances = {};  // instance data
  self._instanceRunners = {};   // instance contract runners
}

ComputeService.prototype.startInstance = function(token, container_uri, type, vars, port) {
  var this_ = this;
  return new Promise(function(resolve, reject) {
    ensureToken(token);

    var runId = this_._uniqueRunId++;
    new Token({token: token}).fetch({withRelated: ['contract']}).then(function (model) {
      if (!model) {
        return reject(new Error('Invalid contract token'));
      }
      var contractHash = model.related('contract').get('hash');
      var contractToken = model.get('token');

      var contractIdent = formatter.hash(contractHash) + chalk.dim(':' + runId);

      winston.debug(contractIdent, chalk.dim('+++'), 'Starting new instance');

      // Start the contract if there is no currently running instance yet
      var runner = this_._instanceRunners[contractToken];
      if (runner) {
        winston.debug(contractIdent, chalk.dim('+++'), 'Contract is already running');
        return reject(new Error('Instance already running'));
      }
      runner = engine.engine.runContract(contractHash);
      this_._instanceRunners[contractToken] = runner;

      // TODO: modify the engine and sandbox to make this work
      // runner._sandbox.pipeStdout({
      //   write: function (output) {
      //     // TODO Redirect to a stream that clients can subscribe to
      //     winston.debug(contractIdent, chalk.dim('...'),output.replace(/\n$/, ''));
      //   }
      // });
      this_._runningInstances[contractToken] = {
        token: contractToken,
        type: type,
        state: 'running',
        container_hash: contractHash,
        port: port,
// TODO: Update engine to assign ip address to instance.        
        // ip_address: ,
        container_uri: container_uri
      };

// TODO: Emit 'running' from codius-engine
      // runner.on('running', function() {
      //   this_._runningInstances[contractToken].state = 'running'
      // });

      // If the contract exits by itself, update the state.
      // TODO: Should the host be notified so that the balance is no longer debited?
      runner.on('exit', function (code, signal) {
        // delete this_._runningInstances[contractToken];
        this_._runningInstances[contractToken].state = 'stopped'
      });

      return this_._runningInstances[contractToken];
    })

    .then(resolve)
    .error(reject)
  });
}


ComputeService.prototype.getInstances = function() {
  var this_ = this;
//Should this only return running instances?
  return Promise.resolve(this_._runningInstances);
}

ComputeService.prototype.getInstance = function(token) {
  var this_ = this;
  return new Promise(function(resolve, reject) {
    if (!token) { reject(new Error('token must be provided')) }
    var instance = this_._runningInstances[token];
    if (!instance) {
      reject (new Error('Invalid instance token'));
    }
    return resolve(instance);
  })
}

ComputeService.prototype.stopInstance = function(token) {
  var this_ = this;
  if (!token) { Promise.reject(new Error('token must be provided')) }
  var runner = this_._instanceRunners[token];
  var instance = this_._runningInstances[token];
  if (!runner || !instance) {
    return Promise.reject (new Error('Invalid instance token'));
  }
  instance.state = 'stopping';
  runner.kill();
  return Promise.resolve({ state: instance.state });    
}

function ensureToken(token) {
  if (!token) { throw new Error('token must be provided') }
}

module.exports = ComputeService;
