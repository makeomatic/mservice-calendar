const { EVENT_TAGS_TABLE } = require('../constants');

exports.up = knex => (
  knex.schema.table(EVENT_TAGS_TABLE, (table) => {
    table
      .string('section')
      .defaultTo('music')
      .notNullable()
      .comment('this column is used to distribute genres between sub-sections, such as general or music');
  })
);

exports.down = knex => (
  knex.schema.table(EVENT_TAGS_TABLE, (table) => {
    table.dropColumn('section');
  })
);
