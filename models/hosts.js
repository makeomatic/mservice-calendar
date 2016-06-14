const Model = require('./model');

module.exports = class HostModel extends Model {
    constructor() {
        super();

        this._tableName = 'calendar.hosts';
        this._schema = {
            [this._tableName]: {

            }
        }
    }

    static initialize(crate) {
        return crate.create(this.schema);
    }
};