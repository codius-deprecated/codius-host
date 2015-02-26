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

var path    = require('path');
var Promise = require('bluebird');
var request = require('request');
var _       = require('underscore');
var winston = require('winston');

var BillingService = require(path.join(__dirname, 'billing_service'));
var config  = require(path.join(__dirname, 'config'));
var events  = require(path.join(__dirname, 'events'));
var Token   = require(path.join(__dirname, '/../models/token')).model;

/**
 * Class that bills tokens for their running time
 *
 * @param {Integer} opts.pollInterval
 * @param {Integer} opts.millisecondsPerComputeUnit
 */
function Amortizer () {
  var self = this;

  self._instances = {};
  self._millisecondsPerComputeUnit = config.get('milliseconds_per_compute_unit');
  self._polling = false;
  self._poll = null;

  /**
   * Update instance's balance.
   */
  function updateBalance(balance) {
    new Token({id: balance.get('token_id')}).fetch().then(function(token) {
      if (token) {
        // Add new token or update balance
        if (!(token.get('token') in self._instances)) {
          if (!!balance.get('balance')) {
            self._instances[token.get('token')] = {
              lastChargedTime: Date.now(),
              lastCheckedBalance: balance.get('balance'),
              charging: false
            };
          }
        } else {
          self._instances[token.get('token')].lastCheckedBalance = balance.get('balance');
        }
      }
    })
  }
    
  events.on('contract:stopped', function(token){
    delete self._instances[token];
  });
  events.on('balance:credited', updateBalance);
  events.on('balance:debited', updateBalance);
}


/**
 * Start the recursive pollRunningInstances loop
 */
Amortizer.prototype.startPollingRunningInstances = function(pollInterval){
  var self = this;

  if (self._polling) {
    winston.info('Amortizer is already polling');
    return;
  }
  if (!pollInterval) {
    pollInterval = 100
  }
  self._polling = true;
  // TODO: Should minBalance just be 0? Instances are terminating with a balance of 1.
  var minBalance = Math.ceil(pollInterval / self._millisecondsPerComputeUnit);
  self._poll = setInterval(function(){
    self.pollRunningInstances(minBalance);
  }, pollInterval);
};

/**
 * Check each of the active tokens to determine if their balances are
 * running low. If one appears to have a balance less than the minimum,
 * charge the token for its time used. If the balance is still too low,
 * then kill the instance.
 */
Amortizer.prototype.pollRunningInstances = function(minBalance){
  var self = this;

  request
    .get('http://127.0.0.1:' + ((parseInt(process.env.PORT) || 5000) + 30) + '/instances', function(err, res, body){
      var activeInstances;
      if (!err && res.statusCode == 200) {
        activeInstances = JSON.parse(body).instances
      } else {
        winston.debug('Error polling instances: ' + err);
        activeInstances = [];
      }
      return Promise.each(activeInstances, function(activeInstance){
        new Token({token: activeInstance.token}).fetch().then(function(token) {
          if (!token) {
            winston.debug('Error: invalid token (' + activeInstance.token + ')');
            return;
          }
          // Check balance of running instances in the _instances array
          // that are not in the process of being charged
          // Instances are added when their balances are first credited
          if (activeInstance.state!=='running' || !(token.get('token') in self._instances) || 
              self._instances[token.get('token')].charging) {
            return;
          }
          // Kill instances with depleted balance
          // Note that we don't check the balance every time
          // to avoid unnecessary database reads
          if (self._instances[token.get('token')].lastCheckedBalance <= minBalance) {
            delete self._instances[token.get('token')];
            request.del('http://127.0.0.1:'+((parseInt(process.env.PORT) || 5000) + 30)+
                        '/instances/'+token.get('token'), function (error, res, body) {
              if (error) {
                winston.debug('Error killing instance (' + token.get('token') + '): ' + error);
              }
            });
          } else if (self._instances[token.get('token')].lastCheckedBalance - self.calculateCharge(token) <= minBalance) {
            self.chargeToken(token);
          }
        })
      })
  });
};

/**
 * Charge is based on the cost per millisecond, which is set by the host
 */
Amortizer.prototype.calculateCharge = function(token) {
  var self = this;
  var runTime = Date.now() - self._instances[token.get('token')].lastChargedTime;
  var charge = Math.ceil(runTime / self._millisecondsPerComputeUnit);
  return charge;
};

/**
 * Calculate the amount owed since the lastChargedTime and apply the charge
 */
Amortizer.prototype.chargeToken = function(token) {
  var self = this;

  self._instances[token.get('token')].charging = true;
  return new BillingService().debit(token, self.calculateCharge(token))
  .then(function(debit) {
    if (debit) {
      self._instances[token.get('token')].lastChargedTime = Date.now();
    }
    self._instances[token.get('token')].charging = false;
    return token.getBalance();
  })
  .then(function(balance) {
    return balance.get('balance')
  })
};

/**
 * If the token has an instance currently running
 * we need to charge it to be able to return the most current
 * balance, otherwise we can just read the balance
 * from the database
 */
Amortizer.prototype.checkTokenBalance = function(token) {
  var self = this;

  if (token.get('token') in self._instances) {
    return self.chargeToken(token);
  } else {
    return token.getBalance().then(function(balance) {
      return balance.get('balance');
    });
  }
};

Amortizer.prototype.stopPollingRunningInstances = function(){
  var self = this;
  self._polling = false;
  if (self._poll) {
    clearInterval(self._poll);
    self._poll = null;
  }
};

module.exports = new Amortizer();
