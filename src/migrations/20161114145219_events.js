const Promise = require('bluebird');
const { EVENT_TABLE } = require('../constants');

exports.up = knex => Promise.join(
  knex.schema.table(EVENT_TABLE, (table) => {
    table.dropColumn('recurring');
    table.dropColumn('start_time');
    table.dropColumn('end_time');
  }),
  knex.schema.raw(`ALTER TABLE ${EVENT_TABLE} ALTER duration TYPE integer USING (duration::integer)`)
);

exports.down = knex => (
  knex.schema.table(EVENT_TABLE, (table) => {
    table.boolean('recurring').defaultTo(false);
    table.timestamp('start_time');
    table.timestamp('end_time');
  })
);
