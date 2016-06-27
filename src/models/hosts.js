const Model = require('./model');

class HostModel extends Model {
    constructor(db, data) {
        super(db);

        this.tableName = this.db._namespace + '.' + HostModel.tableName;
        this.schema = {[this.tableName]: HostModel.schema};
    }
}

HostModel.tableName = 'hosts';
HostModel.schema = {
    'id': 'integer primary key',
    'external_id': 'string primary key',
    'name': 'string'
};

module.exports = HostModel;