var bluebird  = require('bluebird');

bluebird.Promise.longStackTraces();

var sinon      = require('sinon');
var assert     = require('assert');
var path       = require('path');
var tls        = require('tls');
var CodiusHost = require(path.join(__dirname, '/../'));
var chai      = require('chai');
var chaiAsPromised = require('chai-as-promised');
var genkey     = require('./genkey');
var nconf      = require('../lib/config');

var expect = chai.expect;

describe('Codius Host primary server', function() {

  beforeEach(function() {
    return genkey().then(function(v) {
      nconf.set('ssl:key', v.keyPath);
      nconf.set('ssl:cert', v.certPath);
    });
  });

  it('#start should bind to port with a tls server', function() {

    var tlsCreateServer = sinon.spy(tls, 'createServer');

    return new CodiusHost.Server().start().then(function(status) {
      assert(tlsCreateServer.called);
    });
  });
});

