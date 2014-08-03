var express = require('express');
var morgan = require('morgan');
var winston = require('winston');
var knex = require('knex');

var nconf = require('./lib/config');

var app = express();

var codiusEngine = require('codius-engine');
var EngineConfig = codiusEngine.Config;
var Compiler = codiusEngine.Compiler;
var FileManager = codiusEngine.FileManager;
var FileHash = codiusEngine.FileHash;
var Engine = codiusEngine.Engine;

var routePostContract = require('./routes/post_contract');
var routePostToken = require('./routes/post_token');

// Put winston into CLI mode (prettier)
winston.cli();
winston.default.transports.console.level = 'debug';

var engineConfig = new EngineConfig(nconf.get('engine'));
var compiler = new Compiler(engineConfig);
var fileManager = new FileManager(engineConfig);

app.set('fileManager', fileManager);

var winstonStream = {write: function (data) {
  winston.info(data.replace(/\n$/, ''));
}};
app.use(morgan(nconf.get('log_format'), {stream: winstonStream}))

app.post('/contract', routePostContract);
app.post('/token', routePostToken);

var db = knex.initialize(nconf.get('db'));

db.migrate.latest().then(function () {
  app.listen(nconf.get('http').port);

  winston.info('Codius host running on port '+nconf.get('http').port);
}).done();
