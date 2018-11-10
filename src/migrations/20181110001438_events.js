const { EVENT_TABLE } = require('../constants');

// ensures that all events
exports.up = async (knex) => {
  await knex.schema.table(EVENT_TABLE, (table) => {
    table.integer('version').defaultTo(0);
  });
};

exports.down = knex => (
  knex.schema.table(EVENT_TABLE, (table) => {
    table.dropColumn('version');
  })
);
