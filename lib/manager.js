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
var chalk = require('chalk');
var Promise = require('bluebird');

var formatter = require('./formatter');
var engine = require('./engine');
var config = require('./config');
var request = require('request');

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

  self._runningInstances = {};
  self._pollInterval = opts.pollInterval || 100;
  self._millisecondsPerComputeUnit = opts.millisecondsPerComputeUnit || 100;
  self._minBalance = Math.ceil(self._pollInterval / self._millisecondsPerComputeUnit);
  self._polling = false;

  self.startPollingRunningInstances();
}

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
          request.del('http://127.0.0.1:'+((parseInt(process.env.PORT) || 5000) + 30)+
                      '/instances/'+token.get('token'), function (error, res, body) {
            if (error) {
              winston.debug('Error killing instance (' + token + '): ' + error);
            } else {
              winston.debug('Killed token "' + token + '"');
              delete instance;
            }
          });
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
    if (self._runningInstances[token]) {
      self._runningInstances[token].lastChargedTime = Date.now();
      self._runningInstances[token].lastCheckedBalance = newBalance;
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
Manager.prototype.checkTokenBalance = function(token) {
  var self = this;

  if (self._runningInstances[token]) {
    return self.chargeToken(token);
  } else {
    return self._checkTokenBalance(token);
  }
};

/**
 * Private method to read the token balance from the database
 */
Manager.prototype._checkTokenBalance = function(token) {
  var self = this;
  return new Token({token: token}).fetch({
    withRelated: ['balance']
  }).then(function(model){
    var balance = model.related('balance').get('balance');
    return balance;
  });
}

Manager.prototype.stopPollingRunningInstances = function(){
  var self = this;
  self._polling = false;
};

exports.Manager = Manager;
