const Promise = require('bluebird');
const { EVENT_TABLE } = require('../constants');

// ensures that all events
exports.up = knex => Promise.all([
  knex.schema.raw(`ALTER TABLE ${EVENT_TABLE} ALTER tags TYPE varchar(30)[]`),
  knex.schema.raw(`CREATE INDEX tags_gin ON ${EVENT_TABLE} using gin ("tags")`),
]);

exports.down = knex => (
  knex.schema.raw(`ALTER TABLE ${EVENT_TABLE} ALTER tags TYPE varchar(255)[]`)
);
