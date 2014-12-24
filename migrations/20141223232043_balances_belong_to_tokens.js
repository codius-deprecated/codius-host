'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.table('balances', function(t){
    t.integer('token_id').unsigned().index().references('id').inTable('tokens');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('balances', function(t){
    t.dropColumn('token_id');
  });
};
