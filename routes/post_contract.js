
var tarStream = require('tar-stream');
var zlib = require('zlib');
var concat = require('concat-stream');
var winston = require('winston');
var path = require('path');

/**
 * Upload a contract.
 */
module.exports = function (req, res, next) {
  var fileManager = req.app.get('fileManager');
  var gunzip = zlib.createGunzip();
  var tarExtract = tarStream.extract();
  req.pipe(gunzip).pipe(tarExtract);

  var fileRegistry = {};
  var fakeFilesystem = {
    readFile: function (filename) {
      return fileRegistry[path.normalize(filename)].data;
    },
    stat: function (filename) {
      return {
        isFile: function () {
          return !fileRegistry[path.normalize(filename)].directory;
        },
        isDirectory: function () {
          return !!fileRegistry[path.normalize(filename)].directory;
        }
      }
    },
    exists: function (filename) {
      return !!fileRegistry[path.normalize(filename)];
    },
    readdir: function (dirname) {
      dirname = path.normalize(dirname).replace(/\/*$/, '/');
      var files = Object.keys(fileRegistry).filter(function (filename) {
        return filename.substr(0, dirname.length) === dirname &&
          filename !== dirname;
      }).map(function (filename) {
        return filename.substr(dirname.length);
      }).filter(function (filename) {
        return !/\/./.exec(filename);
      });
      return files;
    }
  };

  // While parsing tar file, load all files into an in-memory array
  tarExtract.on('entry', function(header, stream, callback) {
    var filename = path.normalize(header.name);
    winston.debug('processing file', filename);
    fileRegistry[filename] = header;
    if (header.type !== 'file') return callback();

    stream.pipe(concat(function (fileData) {
      if (!Buffer.isBuffer(fileData)) {
        fileData = new Buffer(0);
      }
      fileRegistry[filename].data = fileData;
      callback();
    }));
  });

  tarExtract.on('finish', function() {
    var compiler = req.app.get('compiler');
    compiler.setFilesystem(fakeFilesystem);
    compiler.on('file', function (event) {
      fileManager.storeFileWithHash(event.hash, event.data);
    });

    var contractHash = compiler.compileModule('codius-example-require');

    var db = req.app.get('db');
    db('contracts').where({hash: contractHash}).count('*').then(function (count) {
      count = count.shift()['count(*)'];
      if (!count) {
        return db.insert({hash: contractHash}).into('contracts');
      } else {
        return false;
      }
    }).then(function (val) {
      if (val) {
        winston.debug('stored contract', contractHash);
        res.send(204);
      } else {
        winston.debug('already have contract', contractHash);
        res.send(204);
      }
    }).catch(function (error) {
      next(error);
    });
  });
};
