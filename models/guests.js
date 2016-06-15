const Model = require('./model');

class GuestModel extends Model {
    constructor(...args) {
        super(...args);
    }

    static migrate(crate) {
        return crate.create(GuestModel.schema);
    }
}

GuestModel.tableName = 'calendar.guests';
GuestModel.schema = {
    [GuestModel.tableName]: {
        'id': 'integer primary key',
        'external_id': 'string primary key',
        'name': 'string'
    }
};

module.exports = GuestModel;