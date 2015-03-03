var path     = require('path');
var express  = require('express');
var morgan   = require('morgan');
var config   = require('./config');
var log      = require('./log');
var db       = require('./db');
var engine   = require('./engine');
var tokenLib = require('./token');
var Token    = require('./../models/token').model;

var routeGetHealth        = require('../routes/get_health');
var routePostContract     = require('../routes/post_contract');
var routePostToken        = require('../routes/post_token');
var routeGetTokenMetadata = require('../routes/get_token_metadata');
var routeRoot             = require('../routes/root');
var routeHostMeta         = require('../routes/host_meta');

function Application() { 

  var app = express();

  app.use(morgan(config.get('log_format'), {stream: log.winstonStream}))

  app.set('config', config);
  app.set('knex', db.knex);
  app.set('bookshelf', db.bookshelf);
  app.set('compiler', engine.compiler);
  app.set('fileManager', engine.fileManager);
  app.set('engine', engine.engine);

  app.get('/', routeRoot)
  app.get('/.well-known/host-meta.json', routeHostMeta)
  app.get('/health', routeGetHealth);
  app.post('/contract', routePostContract);
  app.post('/token', routePostToken);
  app.get('/token/:token', routeGetTokenMetadata);

  // TODO: take this out, obviously
  app.get('/showmethemoney', function(req, res){
    if (req.query && typeof req.query.token === 'string' && tokenLib.TOKEN_REGEX.test(req.query.token)) {
      new Token({token: req.query.token}).fetch({
        withRelated: ['balance']
      }).then(function(model){
        if (!model) {
          res.status(404).json({
            message: 'Token not found'
          });
          return;
        }

        var balance = model.related('balance');
        balance.set({balance: (parseInt(req.query.amount) || 1000) + balance.get('balance')});
        balance.save().then(function(newBalance){
          res.status(200).json({
            token: model.get('token'),
            balance: newBalance.get('balance')
          });
        })
      })
    }
  });

  return app;
};

module.exports = Application;

