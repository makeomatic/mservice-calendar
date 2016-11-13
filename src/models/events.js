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
    table.increments('id').primary();

    // who does it belong to?
    table.string('owner');

    // name of the show, description of the show
    table.string('title');
    table.text('description');

    // extra meta, not used at the moment
    table.string('link');
    table.string('picture');

    // specifies rrule
    table.text('rrule');
    table.integer('duration');

    // array of djs & music genres
    table.specificType('tags', 'varchar(255)[]');
    table.specificType('hosts', 'varchar(255)[]');

    // not used at the moment
    table.specificType('subscribers', 'varchar(255)[]');
    table.specificType('notifications', 'varchar(255)[]');
  },
};
