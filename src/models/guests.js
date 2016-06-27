const Model = require('./model');

class GuestModel extends Model {
    constructor(db, data) {
        super(db);

        this.tableName = this.db._namespace + '.' + GuestModel.tableName;
        this.schema = {[this.tableName]: GuestModel.schema};
    }
}

GuestModel.tableName = 'guests';
GuestModel.schema = {
    'id': 'integer primary key',
    'external_id': 'string primary key',
    'name': 'string'
};

module.exports = GuestModel;