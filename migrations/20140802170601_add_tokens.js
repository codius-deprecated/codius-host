'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('tokens', function (t) {
    t.increments().primary();
    t.string('token', 16).unique();
    t.integer('contract').unsigned().index().references('id').inTable('contracts');
    t.integer('balance').unsigned().index().references('id').inTable('balances');
    t.integer('parent').unsigned().index().references('id').inTable('tokens');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('tokens');
};
