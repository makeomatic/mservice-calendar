const Model = require('./model');

class GuestModel extends Model {
    constructor(db, data) {
        super(db);

        this.tableName = this.db._namespace + '.' + GuestModel.tableName;
        this.schema = {[this.tableName]: GuestModel.schema};

        // TODO: process data (set some internal variables, etc)
        this.data = data;
    }

    static migrate(db) {
        const tableName = db._namespace + '.' + GuestModel.tableName;
        const schema = {[tableName]: GuestModel.schema};
        return db.create(schema);
    }

    static cleanup(db) {
        const tableName = db._namespace + '.' + GuestModel.tableName;
        return db.drop(tableName);
    }
}

GuestModel.tableName = 'guests';
GuestModel.schema = {
    'id': 'integer primary key',
    'external_id': 'string primary key',
    'name': 'string'
};

module.exports = GuestModel;