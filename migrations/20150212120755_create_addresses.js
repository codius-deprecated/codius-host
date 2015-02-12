
'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('addresses', function(t) {
    t.increments().primary(); 
    t.string('address').notNull();
    t.integer('ledger_id').notNull();
    t.integer('token_id').notNull();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('addresses')  
};


