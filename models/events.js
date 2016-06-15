const Model = require('./model');

class EventModel extends Model {
    constructor(...args) {
        super(...args);
    }
    
    static migrate(crate) {
        return crate.create(EventModel.schema);
    }
}

EventModel.tableName = 'calendar.events';
EventModel.schema = {
    [EventModel.tableName]: {
        'id': 'integer primary key',
        'title': 'string',
        'description': 'string',
        'tags': 'array(string)',
        'days': 'object(strict) as (monday boolean, tuesday boolean, wednesday boolean, thursday boolean, friday boolean, saturday boolean, sunday boolean)',
        'recurring': 'integer',
        'start_time': 'integer',
        'end_time': 'integer'
    }
};

module.exports = EventModel;