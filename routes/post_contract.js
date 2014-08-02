
var tarStream = require('tar-stream');
var zlib = require('zlib');
var concat = require('concat-stream');
var winston = require('winston');

module.exports = function (req, res) {
  var fileManager = req.app.get('fileManager');
  var gunzip = zlib.createGunzip();
  var tarExtract = tarStream.extract();
  req.pipe(gunzip).pipe(tarExtract);

  tarExtract.on('entry', function(header, stream, callback) {
    winston.debug('processing file', header.name);
    if (header.type !== 'file') return callback();

    stream.pipe(concat(function (fileData) {
      if (!Buffer.isBuffer(fileData)) {
        fileData = new Buffer(0);
      }
      fileManager.storeFileData(fileData);
      callback();
    }));
  });
  tarExtract.on('finish', function() {
    res.send(204);
  });
};
