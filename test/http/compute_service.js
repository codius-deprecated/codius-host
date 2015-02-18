var assert    = require('assert')
var _         = require('lodash')
var path      = require('path')
var supertest = require('supertest')
var uuid      = require('uuid')
var codius    = require(path.join(__dirname, '/../../'))
var engine    = require(path.join(__dirname, '/../../lib/engine'))
var server    = require(path.join(__dirname, '/../../compute-service/server'))(codius)
var Contract  = require(path.join(__dirname, '/../../models/contract')).model
var http      = supertest(server)

describe('Compute Service HTTP Interface', function() {
  var contract, token, contractHash;

  before(function(done) {
    var fileManager = engine.fileManager;
    var compiler = engine.compiler;
    var currentDir = path.join(__dirname, '/../test_contract');

    compiler.on('file', function (event) {
      if (event.name.indexOf(currentDir) !== 0) {
        throw new Error('File path does not have current directory prefix: ' + event.name);
      }
      fileManager.storeFileWithHash(event.hash, event.data);
    });

    contractHash = compiler.compileModule(currentDir);
    new Contract({hash: contractHash}).fetch().then(function (_contract) {
      if (_contract) {
        return _contract;
      } else {
        return Contract.forge({
          hash: contractHash
        }).save();
      }
    }).then(function (_contract) {
      contract = _contract;
      new codius.Token({ token: uuid.v4(), contract_id: contract.get('id')}).save().then(function(token_) {
        token = token_;
        done();
      });
    })
  });

  after(function(done) {
    // TODO: Remove contract from filesystem
    contract.destroy().then(function(){
      token.destroy().then(function() {
        done();
      });
    });
  });

  it('should start running a container', function(done) {
    http
      .post('/instances')
      .send({
        token: token.get('token'),
        // container_uri: 
        // type: 
        // vars: 
        // port: 
      })
      .end(function(error, response) {
        assert(response.body.success)
        assert.strictEqual(response.body.instance.token, token.get('token'))
        assert.strictEqual(response.body.instance.container_hash, contractHash)
        assert.strictEqual(response.body.instance.state, 'running')
        done()
      })
  })

  it('should list all running containers', function(done) {
    http
      .get('/instances')
      .expect(200)
      .end(function(error, response) {
        assert(response.body.success)
        var idx = _.findIndex(response.body.instances, function(instance) { return instance.token === token.get('token'); });
        assert.notStrictEqual(idx, -1)
        assert.strictEqual(response.body.instances[idx].container_hash, contractHash)
        assert.strictEqual(response.body.instances[idx].state, 'running')
        done()
      })
  })

  it('should get info on single running container', function(done) {
    http
      .get('/instances/'+token.get('token'))
      .end(function(error, response) {
        assert(response.body.success)
        assert.strictEqual(response.body.instance.token, token.get('token'))
        assert.strictEqual(response.body.instance.container_hash, contractHash)
        assert.strictEqual(response.body.instance.state, 'running')
        done()
      })
  })

  it('should stop a running container', function(done) {
    http
      .delete('/instances/'+token.get('token'))
      .end(function(error, response) {
        assert(response.body.success)
        assert.strictEqual(response.body.instance.state, 'stopping')
        done()
      })
  })

  it.skip('should get a quote to run a container', function(done) {
    http
      .get('/quote')
      .end(function(error, response) {
        assert(response.body.success)
      })
  })

})