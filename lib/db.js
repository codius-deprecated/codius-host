var nconf = require('./config');

var knex = require('knex').initialize(nconf.get('db'));
var bookshelf = require('bookshelf').initialize(knex);

exports.knex = knex;
exports.bookshelf = bookshelf;
