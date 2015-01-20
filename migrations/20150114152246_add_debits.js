'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('debits', function(t) {
    t.increments().primary(); 
    t.integer('balance_id').unsigned().index().references('id').inTable('balances');
    t.decimal('amount');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('debits')  
};

