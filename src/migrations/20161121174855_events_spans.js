const { EVENT_SPANS_TABLE } = require('../constants');

// ensures that all events
exports.up = knex => (
  knex.raw(
    `ALTER TABLE ${EVENT_SPANS_TABLE} ADD CONSTRAINT owner_period_not_overlaps`
    + ' EXCLUDE USING gist (owner WITH =, period WITH &&)'
  )
);

exports.down = () => {};
