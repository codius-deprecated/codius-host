var path           = require('path')
var BridgesExpress = require('bridges-express')
var port           = (parseInt(process.env.PORT) || 5000) + 15

module.exports = function(codius) {

  var server = new BridgesExpress({
    directory: path.join(__dirname),
    controllers: {
      inject: [codius]
    }
  })

  server.listen(port, function() {
    codius.logger.info('Codius Billing Service listening on port', port)
  })
}


