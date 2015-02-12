'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('ledgers', function(t) {
    t.increments().primary(); 
    t.string('name').notNull();
    t.string('last_hash');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('ledgers')  
};
