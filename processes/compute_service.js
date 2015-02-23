
module.exports = function(codius) {

  var server = require(__dirname+'/../compute-service/server')(codius)
  var port   = (parseInt(process.env.PORT) || 5000) + 30

  server.listen(port, function() {
    codius.logger.info('Codius Compute Service listening on port', port)
  })

  codius.events.on('contract:created', function(token){
    codius.compute.startInstance(token.get('token'));
  });
}