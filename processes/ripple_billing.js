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
module.exports = function(codius) {

  if (codius.features.isEnabled('RIPPLE_BILLING')) {
    codius.logger.info("Ripple Billing Feature Enabled")

    const RippleAccountMonitor = require('ripple-account-monitor')
    const http                 = require('superagent')
    const Promise              = require('bluebird')
    const RIPPLE_REST_URL      = 'https://api.ripple.com/'
    const ADDRESS              = codius.config.get('RIPPLE_ADDRESS')
    const billing              = new codius.BillingService()
    const CPU_PER_XRP          = codius.config.get('compute_units_per_xrp')
    const CPU_PER_BITCOIN      = codius.config.get('compute_units_per_bitcoin')

    if (!ADDRESS) {
      throw new Error('RIPPLE_ADDRESS must be set in environment to enable Ripple billing')
    }
    
    codius.Ledger.findOrCreate({ name: 'ripple' }).then(function(ledger) {

      codius.events.on('contract:created', function(token) {
        ledger.registerAddress(token, ADDRESS+'?dt='+token.get('id'))
          .then(function(address) {
            codius.logger.info('address:registered', address.get('address'))
          })
      })

      fetchLastHash(ledger, ADDRESS).then(function(hash) {

        ledger.set('last_hash', hash).save().then(function() {
          var monitor = new RippleAccountMonitor({
            rippleRestUrl: RIPPLE_REST_URL,
            account: ADDRESS,
            lastHash: hash,
            timeout: 3000,
            onTransaction: function(transaction, next) {
              ledger.set('last_hash', transaction.hash).save().then(next)
            },
            onPayment: function(payment, next) {
              handlePayment(payment).then(function() {
                ledger.set('last_hash', payment.hash).save().then(next)
              })
            }
          })

          monitor.start()
          codius.logger.info('Starting Ripple Monitor')
        })
      }) 
    })

    function handlePayment(payment, next) {
      return new Promise(function(resolve, reject) {
        if (payment.DestinationTag) {
          var CPU
          if (!payment.Amount.currency) { // XRP (in drops)
            CPU = payment.Amount / 1000000 * CPU_PER_XRP
          } else if (payment.Amount.currency === 'BTC') {
            CPU = payment.Amount.value * CPU_PER_BITCOIN
          }
          new codius.Token({ id: payment.DestinationTag }).fetch().then(function(token) {
            billing.credit(token, CPU).then(function() {
              codius.logger.info('token:credited', token.get('token'), CPU)
              resolve()
            })
          })
        } else {
          resolve()
        }
      })
    }

    function fetchLastHash(ledger, account) {
      return new Promise(function(resolve, reject) {
        if (ledger.get('last_hash')) {
          resolve(ledger.get('last_hash'))
        } else {
          http
            .get(RIPPLE_REST_URL+'v1/accounts/'+account+'/payments')
            .end(function(error, response) {
              if (error) { return reject(error) }
              if (!response.body.success) { return reject(new Error(response.body)) }
              resolve(response.body.payments[0].hash)
            })
        }
      })
    }
  }
}

