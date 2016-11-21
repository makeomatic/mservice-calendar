const { EVENT_SPANS_TABLE } = require('../constants');

// ensures that all events
exports.up = knex => (
  knex.schema.table(EVENT_SPANS_TABLE, (table) => {
    table.string('owner');
  })
);

exports.down = knex => (
  knex.schema.table(EVENT_SPANS_TABLE, (table) => {
    table.dropColumn('owner');
  })
);
