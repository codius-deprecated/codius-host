'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('tokens', function (t) {
    t.increments().primary();
    t.string('token', 20).unique();
    t.integer('contract_id').unsigned().index().references('id').inTable('contracts');
    t.integer('balance_id').unsigned().index().references('id').inTable('balances');
    t.integer('parent_id').unsigned().index().references('id').inTable('tokens');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('tokens');
};
