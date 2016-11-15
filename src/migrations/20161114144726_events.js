const { EVENT_TABLE } = require('../constants');

exports.up = knex => (
  knex.schema.hasTable(EVENT_TABLE).then((exists) => {
    if (exists) return null;

    return knex.schema.createTable(EVENT_TABLE, (table) => {
      table.increments();

      table.string('owner');
      table.string('title');
      table.text('description');
      table.string('link');
      table.string('picture');

      table.text('rrule');
      table.boolean('recurring').defaultTo(false);

      table.timestamp('start_time');
      table.timestamp('end_time');
      table.string('duration');

      table.specificType('tags', 'varchar(255)[]');
      table.specificType('hosts', 'varchar(255)[]');
      table.specificType('subscribers', 'varchar(255)[]');
      table.specificType('notifications', 'varchar(255)[]');
    });
  })
);

exports.down = knex => knex.schema.dropTable(EVENT_TABLE);
