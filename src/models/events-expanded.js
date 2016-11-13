/**
 * How events work.
 *
 * Holds id & time-spans for the specific events, contains
 */

module.exports = {
  tableName: 'event-spans',
  schema: function create(table) {
    table.integer('event_id').unsigned();
    table.foreign('event_id').references('events.id').onDelete('CASCADE');
    table.timestamp('start_time');
    table.timestamp('end_time');
  },
};
