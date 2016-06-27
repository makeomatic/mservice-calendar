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
    'id': 'string primary key',
    'owner': 'string',
    'hosts': 'array(string)',
    'subscribers': 'array(string)',
    'notifications': 'array(string)',
    'title': 'string',
    'description': 'string',
    'picture': 'string',
    'link': 'string',
    'tags': 'array(string)',
    'rrule': 'string',
    'recurring': 'boolean',
    'start_time': 'timestamp',
    'end_time': 'timestamp',
    'timezone': 'string'
};

module.exports = EventModel;