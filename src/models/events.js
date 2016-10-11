/**
 * How events work.
 *
 * 1. If recurring is true then rrule field is used to calculate event occurrences in specified date range.
 *    Date range is passed as a parameter in controller to generate calendar.
 *    start_time and end_time treated as time-only fields to indicate only time event starts and ends.
 *    If end_time contains date which is next day compared to start_time, it is treated appropriately when
 *    building calendar.
 *
 * 2. If recurring is false then start_time and end_time serve as exact event datetime data.
 */

module.exports = {
  tableName: 'events',
  schema: function create(table) {
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
  },
};
