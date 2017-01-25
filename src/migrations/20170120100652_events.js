const Promise = require('bluebird');
const { EVENT_TABLE } = require('../constants');

// ensures that all events
exports.up = knex => Promise.all([
  knex.schema.raw(`ALTER TABLE ${EVENT_TABLE} ALTER tags TYPE varchar(30)[]`),
  knex.schema.table(EVENT_TABLE, (table) => {
    table.index('tags', 'tags_gin', 'gin');
  }),
]);

exports.down = knex => (
  knex.schema.raw(`ALTER TABLE ${EVENT_TABLE} ALTER tags TYPE varchar(255)[]`)
);
