var path           = require('path')
var BridgesExpress = require('bridges-express')

module.exports = function(codius) {

  var server = new BridgesExpress({
    directory: path.join(__dirname),
    controllers: {
      inject: [codius]
    }
  })

  return server
}
