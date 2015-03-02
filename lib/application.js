var path     = require('path');
var express  = require('express');
var morgan   = require('morgan');
var config   = require(path.join(__dirname, 'config'));
var log      = require(path.join(__dirname, 'log'));
var db       = require(path.join(__dirname, 'db'));
var engine   = require(path.join(__dirname, 'engine'));
var tokenLib = require(path.join(__dirname, 'token'));
var Token    = require(path.join(__dirname, '/../models/token')).model;

var routeGetHealth        = require(path.join(__dirname, '/../routes/get_health'));
var routePostContract     = require(path.join(__dirname, '/../routes/post_contract'));
var routePostToken        = require(path.join(__dirname, '/../routes/post_token'));
var routeGetTokenMetadata = require(path.join(__dirname, '/../routes/get_token_metadata'));

function Application() { 

  var app = express();

  app.use(morgan(config.get('log_format'), {stream: log.winstonStream}))

  app.set('config', config);
  app.set('knex', db.knex);
  app.set('bookshelf', db.bookshelf);
  app.set('compiler', engine.compiler);
  app.set('fileManager', engine.fileManager);
  app.set('engine', engine.engine);

  app.get('/health', routeGetHealth);
  app.post('/contract', routePostContract);
  app.post('/token', routePostToken);
  app.get('/token/:token', routeGetTokenMetadata);

  return app;
};

module.exports = Application;

