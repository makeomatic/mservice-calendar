const { EVENT_SPANS_TABLE, EVENT_TABLE } = require('../constants');

// ensures that all events
exports.up = knex => (
  knex.raw(
    `UPDATE ${EVENT_SPANS_TABLE} SET owner = ${EVENT_TABLE}.owner`
    + ` FROM ${EVENT_TABLE} WHERE ${EVENT_TABLE}.id = ${EVENT_SPANS_TABLE}.event_id`
  )
);

exports.down = () => {};
