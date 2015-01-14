var path       = require('path');
var CodiusHost = require(__dirname);

var config  = require(path.join(__dirname, '/lib/config'));
var Manager = require(path.join(__dirname, '/lib/manager')).Manager;

if (!config.get('bitcoin_bip32_extended_public_key')) {
  throw new Error('Must set bitcoin_bip32_extended_public_key config option. To generate a BIP32 HD Wallet you can use https://bip32jp.github.io/english/');
}

var manager = new Manager({
  pollInterval: 100,
  millisecondsPerComputeUnit: config.get('millisecondsPerComputeUnit') || 100
});

new CodiusHost.Server().start()
  
