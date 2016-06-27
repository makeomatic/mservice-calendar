const reduce = require('lodash/reduce');
const join = require('lodash/join');
const concat = require('lodash/concat');
const moment = require('moment-timezone');

const Promise = require('bluebird');
const Errors = require('common-errors');
const omitBy = require('lodash/omitBy');
const assign = require('lodash/assign');

class Model {
    constructor(db, data) {
        this.db = db;

        this._data = data;
        this._dirty = true;
        this._newInstance = true;
        this._valid = true;
    }

    save() {
        if (!this._valid) throw new Errors.InvalidOperationError('Instance is invalid');

        if (this._newInstance) {
            this._newInstance = false;
            this._dirty = false;
            return Promise.resolve(this.db.insert(this.tableName, this._data)).return(this);
        } else if (this._dirty) {
            this._dirty = false;
            const update = omitBy(this._data, (value, key) => (key == 'id' || value === null));
            const query = this.createUpdate(update, this.tableName, this._data.id);
            return Promise.resolve(this.db.execute(query)).return(this);
        } else {
            return Promise.resolve(this);
        }
    }

    update(data) {
        if (!this._valid) throw new Errors.InvalidOperationError('Instance is invalid');
        this._data = assign({}, this._data, data);
    }

    remove() {
        if (!this._valid) throw new Errors.InvalidOperationError('Instance is invalid');
        const id = this.id;
        this._valid = false;
        return this.db.delete(this.tableName, `id='${id}'`);
    }

    old() {
        if (!this._valid) throw new Errors.InvalidOperationError('Instance is invalid');
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
        let query = reduce(
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
                    where: concat(result.where, condition),
                    arguments: concat(result.arguments, escapedValue)
                };
            },
            {where: [], arguments: []}
        );

        query = reduce(
            filter.order,
            (result, value) => {
                value = value.toLowerCase();
                if (value[0] == '-') {
                    value = value.replace('-', '') + ' desc';
                } else if (value.indexOf('asc') < 0) {
                    value = value + ' asc';
                }
                result.order = concat(result.order, value);
                return result;
            },
            assign(query, { order: [] })
        );

        if (filter.start) {
            query.start = filter.start;
        }

        if (filter.limit) {
            query.limit = filter.limit;
        }

        return query;
    }

    static createClause(filter) {
        let base = [];
        if (filter.where.length > 0) {
            base.push(`where ${join(filter.where, ',')}`);
        }
        if (filter.order.length > 0) {
            base.push(`order by ${join(filter.order, ',')}`);
        }
        if (filter.limit) {
            base.push(`limit ${filter.limit}`);
        }
        if (filter.start) {
            base.push(`offset ${filter.start}`);
        }
        return base;
    }

    static createSelect(tableName, filter) {
        const base = concat([`select * from ${tableName}`], Model.createClause(filter));
        return [join(base, ' '), filter.arguments];
    }

    static createDelete(tableName, filter) {
        const base = concat([`delete from ${tableName}`], Model.createClause(filter));
        return [join(base, ' '), filter.arguments];
    }

    static create(db, klass, data) {
        return new Proxy(new klass(db, data), Model.Proxy);
    }

    static single(db, klass, id) {
        const tableName = db._namespace + '.' + klass.tableName;
        return db.execute(`select * from ${tableName} where id = ? limit 1`, [id]).then((result) => {
            if (result.json.length == 1) {
                return new Proxy(new klass(db, result.json[0]).old(), Model.Proxy);
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
                return new Proxy(new klass(db, item).old(), Model.Proxy);
            });
        });
    }

    static removeByQuery(db, klass, filter) {
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
}

Model.Proxy = {
    get: function(target, name) {
        if (target[name]) return target[name];
        if (!target._valid) throw new Errors.InvalidOperationError('Instance is invalid, cannot get ' + name);
        return name in target._data ? target._data[name] : null;
    },

    set: function(target, name, value) {
        if (target[name]) {
            target[name] = value;
            return true;
        }

        if (!target._valid) throw new Errors.InvalidOperationError('Instance is invalid, cannot set ' + name);

        if (name in target._data) {
            target._data[name] = value;
            target._dirty = true;
            return true;
        }

        return false;
    }
};

module.exports = exports = Model;
