var Promise   = require('bluebird').Promise;

Promise.longStackTraces();

var spawn     = require('child_process').spawn;
var temp      = require('temp');
var fs        = require('fs');
var path      = require('path');

Promise.promisifyAll(fs);

function genkey() {
  return Promise.promisify(temp.mkdir)('codius-host-test').then(function(dir) {
    var keyPath = path.join(dir, 'key.pem');
    var certPath = path.join(dir, 'cert.pem');
    return new Promise(function(resolve, reject) {
      var sslgen = spawn('openssl', [
        'req', '-x509', '-nodes', '-days', '365',
        '-subj', '/CN=codius.org', '-newkey', 'rsa:2048', '-out', certPath, '-keyout', keyPath]);

      sslgen.on('close', function(code) {
        if (code == 0) {
          fs.readFile(certPath, function(err, v) {
            if (err) return reject(err);
            resolve({certContents: v.toString(), certPath: certPath, keyPath: keyPath});
          });
        } else {
          reject(code);
        }
      });
    });
  });
}

module.exports = genkey;
