const { EVENT_TABLE } = require('../constants');

exports.up = knex => (
  knex.schema.table(EVENT_TABLE, (table) => {
    table.dropColumn('recurring');
    table.dropColumn('start_time');
    table.dropColumn('end_time');
  })
);

exports.down = knex => (
  knex.schema.table(EVENT_TABLE, (table) => {
    table.boolean('recurring').defaultTo(false);
    table.timestamp('start_time');
    table.timestamp('end_time');
  })
);
