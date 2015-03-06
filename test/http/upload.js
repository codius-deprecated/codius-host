var Promise   = require('bluebird').Promise;

Promise.longStackTraces();

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var expect    = chai.expect;
var CodiusHost = require(__dirname+'/../../')
var supertest = require('supertest-as-promised')
var Server    = require(__dirname+'/../../billing-service/server');
var tar       = require('tar-stream');
var path      = require('path');
var engine    = require(path.join(__dirname, '/../../lib/engine'))
var zlib      = require('zlib');

chai.use(chaiAsPromised);

describe('Contract uploads', function() {
  var application, http;

  beforeEach(function() {
    application = new CodiusHost.Application();
    http = supertest(application);
  });

  it('Should upload a contract', function() {
    var pack = tar.pack();
    var gzip = zlib.createGzip();
    var compiler = engine.compiler;
    var currentDir = path.join(__dirname, '/../test_contract');

    compiler.on('file', function(event) {
      console.log(event.name);
      if (event.name.indexOf(currentDir) !== 0) {
        return;
      }
      var filename = event.name.slice(currentDir.length);
      if (filename.indexOf('/') === 0) {
        filename = filename.slice(1);
      }
      pack.entry({name: filename}, event.data);
    });

    var hash = compiler.compileModule(currentDir);

    pack.finalize();
    return new Promise(function(resolve, reject) {
      pack.pipe(gzip).pipe(http.post('/contract')).on('end', function() {
        resolve();
      });
    });
  });
});
