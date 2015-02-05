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

  return server
}


