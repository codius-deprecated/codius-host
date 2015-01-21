var winston     = require('winston');
var Promise     = require('bluebird');
var http        = require('http');
var tls         = require('tls');
var net         = require('net');
var fs          = require('fs');
var path        = require('path');
var Application = require(path.join(__dirname, 'application'));

// Load application components - order matters
// Log should be loaded before any components that might log during startup

var config   = require(path.join(__dirname, 'config'));
var log      = require(path.join(__dirname, 'log'));
var db       = require(path.join(__dirname, 'db'));
var tokenLib = require(path.join(__dirname, 'token'));
var manager  = require(path.join(__dirname, 'manager'));

function CodiusHost() {};

CodiusHost.prototype.start = function() {

  return new Promise(function(resolve, reject) {

    var app = new Application();

    var unique = 0, internalServer;
    // Run migrations
    db.knex.migrate.latest().then(function () {
      // This is the internal HTTP server. External people will not connect to
      // this directly. Instead, they will connect to our TLS port and if they
      // weren't specifying a token, we'll assume they want to talk to the host
      // and route the request to this HTTP server.

      // A port value of zero means a randomly assigned port
      internalServer = http.createServer(app);
      return Promise.promisifyAll(internalServer).listenAsync(0, '127.0.0.1');
    }).then(function () {
      // Create public-facing (TLS) server
      var tlsServer = tls.createServer({
        ca: config.get('ssl').ca && fs.readFileSync(config.get('ssl').ca),
        key: fs.readFileSync(config.get('ssl').key),
        cert: fs.readFileSync(config.get('ssl').cert)
      });
      tlsServer.listen(config.get('port'), function () {
        winston.info('Codius host running on port '+config.get('port'));
        resolve();
      });
      var internalServerAddress = internalServer.address();

      tlsServer.on('secureConnection', function (cleartextStream) {
        // Is this connection meant for a contract?
        //
        // We determine the contract being addressed using the Server Name
        // Indication (SNI)
        if (cleartextStream.servername && tokenLib.TOKEN_REGEX.exec(cleartextStream.servername.split('.')[0])) {
          var token = cleartextStream.servername.split('.')[0]
          manager.handleConnection(token, cleartextStream);

        // Otherwise it must be meant for the host
        } else {
          // Create a connection to the internal HTTP server
          var client = net.connect(internalServerAddress.port,
                                   internalServerAddress.address);

          // And just bidirectionally associate it with the incoming cleartext connection.
          cleartextStream.pipe(client);
          client.pipe(cleartextStream);
        }
      });
    }).done();
  });
};

module.exports = CodiusHost;

