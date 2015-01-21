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

var path       = require('path');
var CodiusHost = require(__dirname);

var config   = require(path.join(__dirname, '/lib/config'));
var features = require(path.join(__dirname, '/lib/features'));
var Manager  = require(path.join(__dirname, '/lib/manager')).Manager;

if (features.isEnabled('BITCOIN_BILLING')) {
  console.log("BITCOIN_BILLING ENABLED");
  if (!config.get('bitcoin_bip32_extended_public_key')) {
    throw new Error('Must set bitcoin_bip32_extended_public_key config option. To generate a BIP32 HD Wallet you can use https://bip32jp.github.io/english/');
  }
}

if (features.isEnabled('BILLING_GENERIC')) {
  var manager = new Manager({
    pollInterval: 100,
    millisecondsPerComputeUnit: config.get('millisecondsPerComputeUnit') || 100
  });
}

new CodiusHost.Server().start()

