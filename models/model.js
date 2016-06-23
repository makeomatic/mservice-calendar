const reduce = require('lodash/reduce');
const join = require('lodash/join');
const concat = require('lodash/concat');
const moment = require('moment-timezone');

const Promise = require('bluebird');
const Errors = require('common-errors');
const omitBy = require('lodash/omitby');

module.exports = class Model {
    get data() { return this._data; }
    set data(obj) {
        this._data = Object.assign(this._data, obj);
        this._dirty = true;
    }

    constructor(db, data) {
        this.db = db;

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

    createUpdate(update, tableName, id) {
        const setters = reduce(
            update,
            (result, value, key) => concat(result, `${key}=${Model.convertType(value)}`),
            []
        );

        return `update ${tableName} set ${join(setters, ', ')} where id=${Model.convertType(id)}`;
    }

    // TODO: Date timezone!
    static convertType(value) {
        switch (typeof value) {
            case 'string':
                return `'${value}'`;
            case 'number':
            case 'boolean':
                return value;
            case 'object':
                if (Array.isArray(value)) {
                    return '[' + join(value.map(Model.convertType), ', ') + ']';
                } else if (value instanceof Date) {
                    return `'${moment(value).format()}'`;
                } else {
                    return 'null';
                }
            default:
                return 'null';
        }
    };
    
    static createFilter(filter) {
        return reduce(
            filter.where,
            (result, value, key) => {
                let operator = '=';
                if (Array.isArray(value)) {
                    operator = value[0];
                    value = value[1];
                }
                const condition = `${key} ${operator} ?`;
                const escapedValue = Model.convertType(value);

                return {
                    command: concat(result.command, condition),
                    arguments: concat(result.arguments, escapedValue)
                };
            },
            {command: [], arguments: []}
        );
    }

    static createSelect(tableName, where) {
        let base = `select * from ${tableName}`;
        if (where.command.length > 0) {
            base += ` where ${join(where.command, ',')}`;
        }

        return [base, where.arguments];
    }

    static createDelete(tableName, where) {
        let base = `delete from ${tableName}`;
        if (where.command.length > 0) {
            base += ` where ${join(where.command, ',')}`;
        }

        return [base, where.arguments];
    }

    static single(db, klass, id) {
        const tableName = db._namespace + '.' + klass.tableName;
        return db.execute(`select * from ${tableName} where id = ? limit 1`, [id]).then((result) => {
            if (result.json.length == 1) {
                return new klass(db, result.json[0]).old();
            } else {
                throw new Errors.Argument('Object with specified ID not found');
            }
        });
    }

    static filter(db, klass, filter) {
        const tableName = db._namespace + '.' + klass.tableName;
        const where = Model.createFilter(filter);
        const query = Model.createSelect(tableName, where);
        return db.execute(query[0], query[1]).then((result) => {
            return result.json.map((item) => {
                return new klass(db, item).old();
            });
        });
    }

    static remove(db, klass, filter) {
        const tableName = db._namespace + '.' + klass.tableName;
        const where = Model.createFilter(filter);
        const query = Model.createDelete(tableName, where);
        return db.execute(query[0], query[1]).then((result) => {
            // sadly, rowcount means nothing for delete queries, just ignore it :(
            const rowcount = result.rowcount || 0;
            return rowcount >= 0 ? rowcount : 0;
        });
    }

    static migrate(db, klass) {
        const tableName = db._namespace + '.' + klass.tableName;
        const schema = {[tableName]: klass.schema};
        return db.create(schema);
    }

    static cleanup(db, klass) {
        const tableName = db._namespace + '.' + klass.tableName;
        return db.drop(tableName);
    }
};