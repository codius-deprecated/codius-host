'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('contracts', function (t) {
    t.increments().primary();
    t.binary('hash');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('contracts');
};
