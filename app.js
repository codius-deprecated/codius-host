var express = require('express');
var morgan = require('morgan');
var winston = require('winston');
var chalk = require('chalk');

// Load application components - order matters
var config = require('./lib/config');
// Log should be loaded before any components that might log during startup
var log = require('./lib/log');
var db = require('./lib/db');
var engine = require('./lib/engine');

var app = express();

app.use(morgan(config.get('log_format'), {stream: log.winstonStream}))

var routePostContract = require('./routes/post_contract');
var routePostToken = require('./routes/post_token');
var routeRunContract = require('./routes/run_contract');

app.set('config', config);
app.set('knex', db.knex);
app.set('bookshelf', db.bookshelf);
app.set('compiler', engine.compiler);
app.set('fileManager', engine.fileManager);
app.set('engine', engine.engine);

app.post('/contract', routePostContract);
app.post('/token', routePostToken);
app.all('/:token/*', routeRunContract);

db.knex.migrate.latest().then(function () {
  app.listen(config.get('http').port);

  winston.info('Codius host running on port '+config.get('http').port);
}).done();
