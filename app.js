var express = require('express');
var morgan = require('morgan');
var winston = require('winston');

var config = require('./lib/config');
var db = require('./lib/db');

var app = express();

var codiusEngine = require('codius-engine');
var EngineConfig = codiusEngine.Config;
var Compiler = codiusEngine.Compiler;
var FileManager = codiusEngine.FileManager;
var FileHash = codiusEngine.FileHash;
var Engine = codiusEngine.Engine;

var engineConfig = new EngineConfig(config.get('engine'));
var compiler = new Compiler(engineConfig);
var fileManager = new FileManager(engineConfig);

var routePostContract = require('./routes/post_contract');
var routePostToken = require('./routes/post_token');

// Put winston into CLI mode (prettier)
winston.cli();
winston.default.transports.console.level = 'debug';

var winstonStream = {write: function (data) {
  winston.info(data.replace(/\n$/, ''));
}};
app.use(morgan(config.get('log_format'), {stream: winstonStream}))

app.set('config', config);
app.set('knex', db.knex);
app.set('bookshelf', db.bookshelf);
app.set('compiler', compiler);
app.set('fileManager', fileManager);

app.post('/contract', routePostContract);
app.post('/token', routePostToken);

db.knex.migrate.latest().then(function () {
  app.listen(config.get('http').port);

  winston.info('Codius host running on port '+config.get('http').port);
}).done();
