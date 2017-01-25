const { EVENT_TAGS_TABLE } = require('../constants');

exports.up = knex => (
  knex.schema.createTable(EVENT_TAGS_TABLE, (table) => {
    // id of the tag
    table.string('id', 30).primary();
    // english translation
    table.string('eng');
    // icon URL
    table.text('icon');
    // cover URL
    table.text('cover');
    // int for sorting
    table.integer('priority').index();
  })
);

exports.down = knex => knex.schema.dropTable(EVENT_TAGS_TABLE);
