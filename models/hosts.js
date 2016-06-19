const Model = require('./model');

class HostModel extends Model {
    constructor(db, data) {
        super(db);

        this.tableName = this.db._namespace + '.' + HostModel.tableName;
        this.schema = {[this.tableName]: HostModel.schema};

        // TODO: process data (set some internal variables, etc)
        this.data = data;
    }

    static migrate(db) {
        const tableName = db._namespace + '.' + HostModel.tableName;
        const schema = {[tableName]: HostModel.schema};
        return db.create(schema);
    }

    static cleanup(db) {
        const tableName = db._namespace + '.' + HostModel.tableName;
        return db.drop(tableName);
    }
}

HostModel.tableName = 'hosts';
HostModel.schema = {
    'id': 'integer primary key',
    'external_id': 'string primary key',
    'name': 'string'
};

module.exports = HostModel;