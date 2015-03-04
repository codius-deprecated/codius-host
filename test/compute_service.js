var Promise = require('bluebird').Promise;

Promise.longStackTraces();
var nconf      = require('../lib/config');
nconf.set('db:connection:filename', ':memory:');

var db         = require('../lib/db');

var assert    = require('assert')
var _         = require('lodash')
var path      = require('path')
var uuid      = require('uuid')
var compute   = require(path.join(__dirname, '/../lib/compute_service'))
var engine    = require(path.join(__dirname, '/../lib/engine'))
var Contract  = require(path.join(__dirname, '/../models/contract')).model
var Token     = require(path.join(__dirname, '/../models/token')).model
var chai      = require('chai');
var chaiAsPromised = require('chai-as-promised');
var temp      = require('temp');

temp.track();

chai.use(chaiAsPromised);
var expect = chai.expect;

describe('Compute Service', function() {
  var contract, token, contractHash;

  before(function() {
    return db.knex.migrate.rollback(db.conf);
  });

  beforeEach(function() {
    return Promise.promisify(temp.mkdir)('codius-host-test').then(function(dir) {
      engine.engineConfig.contractsFilesystemPath = dir;
      var fileManager = engine.fileManager;
      var compiler = engine.compiler;
      var currentDir = path.join(__dirname, '/test_contract');
      
      return db.knex.migrate.latest(db.conf).then(function () {
        var p = [];
        compiler.on('file', function (event) {
          if (event.name.indexOf(currentDir) !== 0) {
            throw new Error('File path does not have current directory prefix: ' + event.name);
          }
          p.push(fileManager.storeFileWithHash(event.hash, event.data));
        });

        contractHash = compiler.compileModule(currentDir);

        p.push(new Contract({hash: contractHash}).fetch().then(function (_contract) {
            if (_contract) {
              return _contract;
            } else {
              return Contract.forge({
                hash: contractHash
              }).save();
            }
          }).then(function (_contract) {
            contract = _contract;
            return new Token({ token: uuid.v4(), contract_id: contract.get('id')}).save().then(function(token_) {
              token = token_;
              compute._instances[token.get('token')] = {
                state: 'pending',
                container_hash: contract.get('hash')
              }
            });
          })
        );

        return Promise.all(p);
      });
    });
  });

  afterEach(function() {
    return db.knex.migrate.rollback(db.conf);
  });

  it('should start a new running instance', function(done) {

    expect(compute.startInstance(token).then(function(instance) {
      assert.strictEqual(instance.token, token.get('token'));
      assert.strictEqual(instance.container_hash, contractHash);
      assert.strictEqual(instance.state, 'running');
    })).to.notify(done);
  });

  it('should list all instances', function() {
    
    return compute.startInstance(token).then(function(instance) {
      return compute.getInstances().then(function(instances) {
        var idx = _.findIndex(instances, function(instance) { return instance.token === token.get('token'); });
        assert.notStrictEqual(idx, -1)
        assert.strictEqual(instances[idx].container_hash, contractHash);
        assert.strictEqual(instances[idx].state, 'running');
      });
    });
  })

  it('should get info on single running instance', function() {
    return compute.startInstance(token).then(function(_) {
      return compute.getInstance(token).then(function(instance) {
        assert.strictEqual(instance.token, token.get('token'));
        assert.strictEqual(instance.container_hash, contractHash);
        assert.strictEqual(instance.state, 'running');
      });
    });
  });

  it('should stop a running instance', function() {
    return compute.startInstance(token).then(function(instance) {
      return compute.stopInstance(token);
    }).then(function(state) {
      assert.strictEqual(state, 'stopping');
    });
  });

  it.skip('should get a quote to run an instance', function(done) {

    expect(compute.getQuote().then(function(quote) {
      assert(quote);
    })).to.notify(done);
  });
});

