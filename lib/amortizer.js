//------------------------------------------------------------------------------
/*
    This file is part of Codius: https://github.com/codius
    Copyright (c) 2014 Ripple Labs Inc.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose  with  or without fee is hereby granted, provided that the above
    copyright notice and this permission notice appear in all copies.

    THE  SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
    WITH  REGARD  TO  THIS  SOFTWARE  INCLUDING  ALL  IMPLIED  WARRANTIES  OF
    MERCHANTABILITY  AND  FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
    ANY  SPECIAL ,  DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
    WHATSOEVER  RESULTING  FROM  LOSS  OF USE, DATA OR PROFITS, WHETHER IN AN
    ACTION  OF  CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
    OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/
//==============================================================================

var winston = require('winston');
var Promise = require('bluebird');
var request = require('request');
var _       = require('underscore');

var config  = require('./config');
var events  = require(__dirname+'/../lib/events');
var Token   = require('../models/token').model;

/**
 * Class that bills tokens for their running time
 *
 * @param {Integer} opts.pollInterval
 * @param {Integer} opts.millisecondsPerComputeUnit
 */
function Amortizer (opts) {
  var self = this;

  if (!opts) {
    opts = {};
  }

  self._instances = {};
  self._pollInterval = opts.pollInterval || 100;
  self._millisecondsPerComputeUnit = opts.millisecondsPerComputeUnit || 100;
  self._minBalance = Math.ceil(self._pollInterval / self._millisecondsPerComputeUnit);
  self._polling = false;

  self.startPollingRunningInstances();

  events.on('contract:stopped', function(token){
    delete self._instances[token];
  });
}


/**
 * Start the recursive pollRunningInstances loop
 */
Amortizer.prototype.startPollingRunningInstances = function(){
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
Amortizer.prototype.pollRunningInstances = function(){
  var self = this;
  if (!self._polling) {
    return;
  }

  request
    .get('http://127.0.0.1:' + ((parseInt(process.env.PORT) || 5000) + 30) + '/instances', function(err, res, body){
      var activeInstances;
      if (!err && res.statusCode == 200) {
        activeInstances = JSON.parse(body).instances
      } else {
        winston.debug('Error polling instances: ' + err);
        activeInstances = {};
      }
      return Promise.each(activeInstances, function(activeInstance){
        var token = activeInstance.token;
        new Token({token: token}).fetch({withRelated: ['balance']}).then(function (model) {
          if (!model) {
            winston.debug('Error polling instance: ' + token);
            return;
          }
          if (!(token in self._instances) && activeInstance.state==='running') {
            self._instances[token] = {
              lastCheckedBalance: model.related('balance').get('balance'),
              lastChargedTime: Date.now()
            };
          }
          var instance = self._instances[token];
          // Note that we don't check the balance every time
          // to avoid unnecessary database reads
          if (activeInstance.state==='running' && instance.lastCheckedBalance - self.calculateCharge(token) <= self._minBalance) {
            self.chargeToken(token).then(function(newBalance){
              if (newBalance < self._minBalance) {
                request.del('http://127.0.0.1:'+((parseInt(process.env.PORT) || 5000) + 30)+
                            '/instances/'+token, function (error, res, body) {
                  if (error) {
                    winston.debug('Error killing instance (' + token + '): ' + error);
                  }
                });
              }
            });
          }
        })
      }).delay(self._pollInterval).then(self.pollRunningInstances.bind(self));
    });
};

/**
 * Charge is based on the cost per millisecond, which is set by the host
 */
Amortizer.prototype.calculateCharge = function(token) {
  var self = this;
  var instance = self._instances[token];
  var runTime = Date.now() - instance.lastChargedTime;
  var charge = Math.ceil(runTime / self._millisecondsPerComputeUnit);
  return charge;
};

/**
 * Calculate the amount owed since the lastChargedTime and apply the charge
 */
Amortizer.prototype.chargeToken = function(token) {
  var self = this;
  return self._checkTokenBalance(token)
  .then(function(balance){
    return balance - self.calculateCharge(token);
  })
  // Update the balance in the database
  .then(function(newBalance){
    return new Token({token: token}).fetch({
      withRelated: ['balance']
    }).then(function(model){
      var bal = model.related('balance');
      bal.set({ balance: newBalance });
      return bal.save();
    });
  }).then(function(model){
    return model.get('balance');
  })
  // Update the entry in the runningInstances map
  // and return the newBalance
  .then(function(newBalance){
    if (self._instances[token]) {
      self._instances[token].lastChargedTime = Date.now();
      self._instances[token].lastCheckedBalance = newBalance;
    }
    return newBalance;
  });
};

/**
 * If the token has an instance currently running
 * we need to charge it to be able to return the most current
 * balance, otherwise we can just read the balance
 * from the database
 */
Amortizer.prototype.checkTokenBalance = function(token) {
  var self = this;

  if (self._instances[token]) {
    return self.chargeToken(token);
  } else {
    return self._checkTokenBalance(token);
  }
};

/**
 * Private method to read the token balance from the database
 */
Amortizer.prototype._checkTokenBalance = function(token) {
  var self = this;
  return new Token({token: token}).fetch({
    withRelated: ['balance']
  }).then(function(model){
    var balance = model.related('balance').get('balance');
    return balance;
  });
}

Amortizer.prototype.stopPollingRunningInstances = function(){
  var self = this;
  self._polling = false;
};

exports.Amortizer = Amortizer;
