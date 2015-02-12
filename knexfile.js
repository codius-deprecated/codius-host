var nconf = require('./lib/config');

var env = process.env.NODE_ENV || 'development';
exports[env] = nconf.get('db');

