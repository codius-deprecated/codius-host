var fs   = require('fs')
var path = require('path')

module.exports = function(req, res) {
  fs.readFile(path.join(__dirname+'/../package.json'), function(error, file) {
    res.status(200).send({
      properties: {
        documentation: "https://codius.org/docs/using-codius/getting-started",
        version: JSON.parse(file.toString()).version
      }
    })
  })
}
