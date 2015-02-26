var Promise = require('bluebird')

module.exports = function(codius) {

  return {
    create: function(req, res, next) {
      return compute.getQuote(req.body.manifest).then(function(price) {
        res.send({
          success: true,
          manifest_hash: req.body.manifest.manifest_hash,
          // price: cpus
          // interval: milliseconds
          // signature: webtoken
        })
      })
      .error(next)
    },
  }
}