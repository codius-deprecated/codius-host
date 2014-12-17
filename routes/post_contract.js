//------------------------------------------------------------------------------
/*
    This file is part of Codius: https://github.com/codius
    Copyright (c) 2014 Ripple Labs Inc.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose  with  or without fee is hereby granted, provided that the above
    copyright notice and this permission notice appear in all copies.

    THE  SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
    WITH  REGARD  TO  THIS  SOFTWARE  INCLUDING  ALL  IMPLIED  WARRANTIES  OF
    MERCHANTABILITY  AND  FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
    ANY  SPECIAL ,  DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
    WHATSOEVER  RESULTING  FROM  LOSS  OF USE, DATA OR PROFITS, WHETHER IN AN
    ACTION  OF  CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
    OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/
//==============================================================================


var tarStream = require('tar-stream');
var zlib = require('zlib');
var concat = require('concat-stream');
var winston = require('winston');
var path = require('path');

var Contract = require('../models/contract').model;

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

    var contractHash = compiler.compileModule('');

    var knex = req.app.get('knex');
    new Contract({hash: contractHash}).fetch().then(function (contract) {
      if (contract) {
        return contract;
      } else {
        return Contract.forge({
          hash: contractHash
        }).save();
      }
    }).then(function (contract) {
      winston.debug('stored contract', contract.get('hash'));
      res.status(200).json({
        hash: contract.get('hash'),
        expires: contract.get('expires')
      });
    }).catch(function (error) {
      next(error);
    });
  });
};
