
module.exports = function(codius) {

  var server = require(__dirname+'/../billing-service/server')(codius)
  var port   = (parseInt(process.env.PORT) || 5000) + 15

  server.listen(port, function() {
    codius.logger.info('Codius Billing Service listening on port', port)
  })
}
