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

