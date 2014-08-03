'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('contracts', function (t) {
    t.increments().primary();
    t.string('hash', 64).unique();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('contracts');
};
