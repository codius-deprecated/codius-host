
module.exports = function(codius) {

  var server = require(__dirname+'/../compute-service/server')(codius)
  var port   = (parseInt(process.env.PORT) || 5000) + 30

  server.listen(port, function() {
    codius.logger.info('Codius Compute Service listening on port', port)
  })

  codius.events.on('contract:created', function(token) {
    console.log('contract:created')
    if (token.get('token') in codius.compute._instances) {
      codius.logger.debug('Created token already a compute instance:', token.get('token'));
      return;
    }
    new codius.Contract({id:token.get('contract_id')}).fetch().then(function(contract) {
      if (!contract) {
        throw new Error('Invalid contract token:', token.get('token'));
      }
      codius.compute._instances[token.get('token')] = {
        state: 'pending',
        container_hash: contract.get('hash')
      };
    })
  });

  codius.events.on('balance:credited', function(balance){
    new codius.Token({id: balance.get('token_id')}).fetch().then(function(token) {
      if (token.get('token') in codius.compute._instances && 
          codius.compute._instances[token.get('token')].state==='pending') {
        codius.compute.startInstance(token);
      }
    })
  });
}