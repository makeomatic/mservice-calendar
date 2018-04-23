const { EVENT_SUBS_TABLE, EVENT_TABLE } = require('../constants');

exports.up = knex => (
  knex.schema.createTable(EVENT_SUBS_TABLE, (table) => {
    table.integer('event_id').unsigned();
    table.foreign('event_id').references(`${EVENT_TABLE}.id`).onDelete('CASCADE');
    table.string('username').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['event_id', 'username'], 'event_subs_id_username_uq');

    table.index('event_id', 'event_subs_id_btree_index', 'btree');
  })
);

exports.down = knex => knex.schema.dropTable(EVENT_SUBS_TABLE);
