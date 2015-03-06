var fs   = require('fs')
var path = require('path')
var config = require('../lib/config')
var features = require('../lib/features')

module.exports = function(req, res) {
  fs.readFile(path.join(__dirname+'/../package.json'), function(error, packagejson) {
    fs.readFile(config.get('SSL_CERT'), function(error, certificate) {

      var properties = {
          documentation: "https://codius.org/docs/using-codius/getting-started",
          version: JSON.parse(packagejson.toString()).version,
          billing: [],
          public_key: certificate.toString()
      }

      if (features.isEnabled('RIPPLE_BILLING')) {
        properties.billing.push({
          network: 'ripple',
          cpu_per_xrp: parseFloat(config.get('compute_units_per_xrp'))
        })
      }

      if (features.isEnabled('BITCOIN_BILLING')) {
        properties.billing.push({
          network: 'bitcoin',
          cpu_per_bitcoin: config.get('compute_units_per_bitcoin')
        })
      }

      res.status(200).send({
        properties: properties
      })
    })
  })
}
