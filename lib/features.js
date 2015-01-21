var fs = require('fs');
var flipper = require('flipper');
var featuresJsonFilePath = __dirname+'/../config/features.json';

if (fs.existsSync(featuresJsonFilePath)) {
  flipper.persist(featuresJsonFilePath);
}

module.exports = flipper;

