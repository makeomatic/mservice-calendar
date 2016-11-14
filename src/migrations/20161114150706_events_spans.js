const { EVENT_SPANS_TABLE, EVENT_TABLE } = require('../constants');

exports.up = knex => (
  knex.schema.createTable(EVENT_SPANS_TABLE, (table) => {
    table.integer('event_id').unsigned();
    table.foreign('event_id').references(`${EVENT_TABLE}.id`).onDelete('CASCADE');
    table.timestamp('start_time');
    table.timestamp('end_time');
    table.specificType('period', 'tsrange');
    table.index('period', 'event_period_gist_idx', 'GiST');
    table.index('event_id', 'event_id_btree_idx', 'btree');
  })
);

exports.down = knex => knex.schema.dropTable(EVENT_SPANS_TABLE);
