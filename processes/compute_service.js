
module.exports = function(codius) {

  var server = require(__dirname+'/../compute-service/server')(codius)
  var port   = (parseInt(process.env.PORT) || 5000) + 30

  server.listen(port, function() {
    codius.logger.info('Codius Compute Service listening on port', port)
  })

  codius.events.on('balance:credited', function(balance){
    new codius.Token({id: balance.get('token_id')}).fetch().then(function(token) {
      if (!(token.get('token') in codius.compute._runningInstances)) {
        codius.compute.startInstance(token);
      }
    })
  });
}