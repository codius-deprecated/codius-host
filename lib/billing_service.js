var path      = require('path');
var Promise   = require('bluebird');
var Overdraft = require(path.join(__dirname, 'overdraft'));
var Debit     = require(path.join(__dirname, '/../models/debit')).model;
var Credit    = require(path.join(__dirname, '/../models/credit')).model;
var Balance   = require(path.join(__dirname, '/../models/balance')).model;

function BillingService() {}

BillingService.Overdraft = Overdraft;

BillingService.prototype.credit = function(token, amount) { 
  return new Promise(function(resolve, reject) {
    ensureToken(token);
    validateAmount(amount);
  
    token.getBalance().then(function(balance) {
      return balance.credit(amount)
    })
    .then(resolve)
    .error(reject);
  });
}

BillingService.prototype.debit = function(token, amount) { 
  var this_ = this;
  return new Promise(function(resolve, reject) {
    ensureToken(token);
    validateAmount(amount);

    token.getBalance().then(function(balance) {
      if (balance.get('balance') >= amount) {
        return balance.debit(amount);
      } else {
        return balance.debit(balance.get('balance')).then(function(debit) {
          reject(new Overdraft(amount - balance.get('balance'), debit));
        });
      }
    })
    .then(resolve)
    .error(reject)
  });
}

BillingService.prototype.getBalance = function(token) { 
  return new Promise(function(resolve, reject) {
    ensureToken(token);
    token.getBalance().then(resolve).error(reject);
  });
}

BillingService.prototype.getCredits = function(token) {
  return new Promise(function(resolve, reject) {
    ensureToken(token);
    token.getBalance().then(function(balance) {
      return balance.related('credits').fetch();
    })
    .then(resolve).error(reject);
  });
}

BillingService.prototype.getDebits = function(token) {
  return new Promise(function(resolve, reject) {
    ensureToken(token);
    token.getBalance().then(function(balance) {
      return balance.related('debits').fetch();
    })
    .then(resolve).error(reject);
  });
}

function ensureToken(token) {
  if (!token) { throw new Error('token must be provided') }
}

function validateAmount(amount) {
  if (!(Number(amount) > 0)) { throw new Error('amount must be greater than 0') }
}

module.exports = BillingService;
