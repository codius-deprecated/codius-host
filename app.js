var express = require('express');
var morgan = require('morgan');
var winston = require('winston');
var Promise = require('bluebird');
var chalk = require('chalk');
var http = require('http');
var tls = require('tls');
var net = require('net');
var fs = require('fs');
var path = require('path');

// Load application components - order matters
var config = require('./lib/config');
// Log should be loaded before any components that might log during startup
var log = require('./lib/log');
var db = require('./lib/db');
var engine = require('./lib/engine');
var tokenLib = require('./lib/token');

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

app.listenAsync = Promise.promisify(app.listen);

var unique = 0, internalSocketPath;
// Run migrations
db.knex.migrate.latest().then(function () {
  // This is the internal HTTP server. External people will not connect to
  // this directly. Instead, they will connect to our TLS port and if they
  // weren't specifying a token, we'll assume they want to talk to the host
  // and route the request to this HTTP server.
  var pathPrefix = config.get('internal_http').path;

  // Find an unused socket path
  // TODO: Clean up previously used sockets
  do {
    internalSocketPath = pathPrefix + '.' + unique++ + '.sock';
  } while (fs.existsSync(internalSocketPath));

  // Listen on internal server
  return app.listenAsync(internalSocketPath);
}).then(function () {
  // Create public-facing (TLS) server
  var tlsServer = tls.createServer({
    key: fs.readFileSync(path.resolve(__dirname, 'server.key')),
    cert: fs.readFileSync(path.resolve(__dirname, 'server.crt'))
  });
  tlsServer.listen(config.get('port'), function () {
    winston.info('Codius host running on port '+config.get('port'));
  });

  tlsServer.on('secureConnection', function (cleartextStream) {
    console.log(cleartextStream.servername);
    // Is this connection meant for a contract?
    //
    // We determine the contract being addressed using the Server Name
    // Indication (SNI)
    if (cleartextStream.servername && tokenLib.TOKEN_REGEX.exec(cleartextStream.servername.split('.')[0])) {
      var token = cleartextStream.servername.split('.')[0]
      routeRunContract(token, cleartextStream);

    // Otherwise it must be meant for the host
    } else {
      // Create a connection to the internal HTTP server
      var client = net.connect(internalSocketPath);

      // And just bidirectionally associate it with the incoming cleartext connection.
      cleartextStream.pipe(client);
      client.pipe(cleartextStream);
    }
  });
}).done();
