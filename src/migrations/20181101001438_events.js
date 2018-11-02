const { EVENT_TABLE } = require('../constants');

// ensures that all events
exports.up = knex => (
  knex.schema.table(EVENT_TABLE, (table) => {
    table.string('tz');
  })
);

exports.down = knex => (
  knex.schema.table(EVENT_TABLE, (table) => {
    table.dropColumn('tz');
  })
);
