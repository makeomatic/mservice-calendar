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

const Promise = require('bluebird');
const Errors = require('common-errors');
const omitBy = require('lodash/omitby');

const Model = require('./model');

class EventModel extends Model {
    get data() { return this._data; }
    set data(obj) {
        this._data = Object.assign(this._data, obj);
        this._dirty = true;
    }

    constructor(db, data) {
        super(db);

        this.tableName = this.db._namespace + '.' + EventModel.tableName;
        this.schema = {[this.tableName]: EventModel.schema};

        this._data = data;
        this._newInstance = true;
    }

    save() {
        if (this._newInstance) {
            this._newInstance = false;
            return Promise.resolve(this.db.insert(this.tableName, this.data)).return(this);
        } else if (this._dirty) {
            this._dirty = false;
            const update = omitBy(this._data, (value, key) => (key == 'id' || value === null));
            const query = this.createUpdate(update, this.tableName, this._data.id);
            return Promise.resolve(this.db.execute(query)).return(this);
        } else {
            return Promise.resolve(this);
        }
    }

    old() {
        this._newInstance = false;
        return this;
    }

    static single(db, id) {
        const tableName = db._namespace + '.' + EventModel.tableName;
        return db.execute(`select * from ${tableName} where id = ?`, [id]).then((result) => {
            if (result.json.length == 1) {
                return new EventModel(db, result.json[0]).old();
            } else {
                throw new Errors.Argument('Object with specified ID not found');
            }
        });
    }

    static filter(db, where) {
        const tableName = db._namespace + '.' + EventModel.tableName;
        return db.execute(`select * from ${tableName} where ?`, [where]).then((result) => {
            return result.json.map((item) => {
                return new EventModel(db, item).old();
            });
        });
    }

    static migrate(db) {
        const tableName = db._namespace + '.' + EventModel.tableName;
        const schema = {[tableName]: EventModel.schema};
        return db.create(schema);
    }
    
    static cleanup(db) {
        const tableName = db._namespace + '.' + EventModel.tableName;
        return db.drop(tableName);
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