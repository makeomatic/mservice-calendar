const Model = require('./model');

module.exports = class EventModel extends Model {
    constructor() {
        super();
        
        this._tableName = 'calendar.events';
        this._schema = {
            [this._tableName]: {
                
            }
        }
    }
    
    static initialize(crate) {
        return crate.create(this.schema);
    }
};