var Promise = require('bluebird').Promise;

Promise.longStackTraces();

var assert    = require('assert')
var _         = require('lodash')
var path      = require('path')
var supertest = require('supertest-as-promised')
var uuid      = require('uuid')
var codius    = require(path.join(__dirname, '/../../'))
var engine    = require(path.join(__dirname, '/../../lib/engine'))
var Server    = require(path.join(__dirname, '/../../compute-service/server'));
var Contract  = require(path.join(__dirname, '/../../models/contract')).model
var temp      = require('temp');

temp.track();

describe('Compute Service HTTP Interface', function() {
  var contract, token, contractHash, server, http;

  before(function() {
    return Promise.promisify(temp.mkdir)('codius-host-test').then(function(dir) {
      engine.engineConfig.contractsFilesystemPath = dir;
      var fileManager = engine.fileManager;
      var compiler = engine.compiler;
      var currentDir = path.join(__dirname, '/../test_contract');
      var p = [];

      compiler.on('file', function (event) {
        if (event.name.indexOf(currentDir) !== 0) {
          throw new Error('File path does not have current directory prefix: ' + event.name);
        }
        p.push(fileManager.storeFileWithHash(event.hash, event.data));
      });

      contractHash = compiler.compileModule(currentDir);

      p.push(new Contract({hash: contractHash}).fetch()
        .then(function (_contract) {
          if (_contract) {
            return _contract;
          } else {
            return Contract.forge({
              hash: contractHash
            }).save();
          }
        }).then(function (_contract) {
          contract = _contract;
          return new codius.Token({ token: uuid.v4(), contract_id: contract.get('id')}).save()
          .then(function(token_) {
            token = token_;
            codius.compute._instances[token.get('token')] = {
              state: 'pending',
              container_hash: contract.get('hash')
            }
          });
        })
      );

      return Promise.all(p);
    });
  });

  beforeEach(function() {
    server = Server(codius);
    http = supertest(server);
  });

  after(function() {
    // TODO: Remove contract from filesystem
    return contract.destroy().then(function(){
      return token.destroy();
    });
  });

  it('should start running a container', function() {
    return http
      .post('/instances')
      .send({
        token: token.get('token'),
        // container_uri: 
        // type: 
        // vars: 
        // port: 
      })
      .expect(200)
      .then(function(response) {
        assert.strictEqual(response.body.instance.token, token.get('token'))
        assert.strictEqual(response.body.instance.container_hash, contractHash)
        assert.strictEqual(response.body.instance.state, 'running')
      });
  })

  it('should list all running containers', function() {
    return http
      .get('/instances')
      .expect(200)
      .then(function(response) {
        var idx = _.findIndex(response.body.instances, function(instance) { return instance.token === token.get('token'); });
        assert.notStrictEqual(idx, -1)
        assert.strictEqual(response.body.instances[idx].container_hash, contractHash)
        assert.strictEqual(response.body.instances[idx].state, 'running')
      });
  })

  it('should get info on single running container', function() {
    return http
      .get('/instances/'+token.get('token'))
      .expect(200)
      .then(function(response) {
        assert.strictEqual(response.body.instance.token, token.get('token'))
        assert.strictEqual(response.body.instance.container_hash, contractHash)
        assert.strictEqual(response.body.instance.state, 'running')
      });
  })

  it('should stop a running container', function() {
    return http
      .delete('/instances/'+token.get('token'))
      .expect(200)
      .then(function(response) {
        assert.strictEqual(response.body.instance.state, 'stopping')
      });
  })

  it.skip('should get a quote to run a container', function() {
    return http
      .get('/quote')
      .expect(200);
  })

})
