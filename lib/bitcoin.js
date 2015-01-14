var Bitcoin = require('bitcoinjs-lib');

var Balance = require('../models/balance').model;

var config = require('./config');

// TODO: store wallets instead of generating them each time
function generateDeterministicWallet(index) {

  if (!config.get('bitcoin_bip32_extended_public_key')) {
    throw new Error('No Bitcoin public key supplied');
  }

  var hdnode = Bitcoin.HDNode.fromBase58(config.get('bitcoin_bip32_extended_public_key'));
  return hdnode.derive(index).getAddress().toString();
}

function convertSatoshisToComputeUnits(satoshis) {
  return satoshis / 100000000 * config.get('compute_units_per_bitcoin');
}
exports.generateDeterministicWallet = generateDeterministicWallet;
