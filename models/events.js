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

const Model = require('./model');

class EventModel extends Model {
    constructor(db, data) {
        super(db, data);

        this.tableName = this.db._namespace + '.' + EventModel.tableName;
        this.schema = {[this.tableName]: EventModel.schema};
    }
}

EventModel.tableName = 'events';
EventModel.schema = {
    'id': 'integer primary key', // unique event ID
    'title': 'string',              // event title
    'description': 'string',              // event description
    'tags': 'array(string)',       // list of categories
    'rrule': 'string',              // recurring rule
    'recurring': 'boolean',             // true for recurring event
    'start_time': 'timestamp',           // event start time
    'end_time': 'timestamp'            // event end time
};

module.exports = EventModel;