'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('contract_storage_entries', function (t) {
    t.increments().primary();
    t.integer('contract_id').unsigned().index().references('id').inTable('contracts');
    t.string('key');
    t.json('value');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('contract_storage_entries');
};
