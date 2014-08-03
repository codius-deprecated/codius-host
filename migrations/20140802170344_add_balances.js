'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('balances', function (t) {
    t.increments().primary();
    t.integer('balance').notNullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('balances');
};
