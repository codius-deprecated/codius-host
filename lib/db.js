var path = require('path');
var nconf = require('./config');

var conf = nconf.get('db');

conf.migrations = { directory: path.resolve(__dirname, '../migrations') };

var knex = require('knex').initialize(conf);
var bookshelf = require('bookshelf').initialize(knex);

exports.knex = knex;
exports.bookshelf = bookshelf;
