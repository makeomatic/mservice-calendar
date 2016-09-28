const reduce = require('lodash/reduce');
const join = require('lodash/join');
const concat = require('lodash/concat');
const moment = require('moment-timezone');
const is = require('is');
const format = require('util').format;
const Promise = require('bluebird');
const Errors = require('common-errors');
const omitBy = require('lodash/omitBy');
const assign = require('lodash/assign');
const map = require('lodash/map');

class Model {
  constructor(db, data) {
    this.db = db;

    this._data = data;
    this._dirty = true;
    this._newInstance = true;
    this._valid = true;
    this._pendingOperations = [];
  }

  fromDb(data) {
    return data;
  }

  save() {
    if (!this._valid) {
      throw new Errors.InvalidOperationError('Instance is invalid');
    }

    if (this._newInstance) {
      this._newInstance = false;
      this._dirty = false;
      return Promise.resolve(this.db.insert(this.tableName, this._data)).return(this);
    } else if (this._dirty) {
      this._dirty = false;
      const update = omitBy(this._data, (value, key) => (key === 'id' || value === null));
      const query = this.createUpdate(update, this.tableName, this._data.id);
      return Promise.resolve(this.db.execute(query[0], query[1])).return(this);
    }

    return Promise.resolve(this);
  }

  update(data) {
    if (!this._valid) throw new Errors.InvalidOperationError('Instance is invalid');
    this._data = assign({}, this._data, data);
  }

  updateArray(field, _data) {
    const data = is.array(_data) ? _data : [_data];

    this._pendingOperations.push({
      op: 'updateArray',
      field,
      data,
    });

    if (!this._data[field]) {
      this._data[field] = data;
    } else {
      this._data[field] = concat(this._data[field], data);
    }
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
    const filter = Model.createFilter({ where: { id } });
    const updates = { fields: [], values: [] };

    reduce(update, (result, value, key) => assign(result, {
      fields: concat(result.fields, `${key} = ?`),
      values: concat(result.values, Model.convertType(value)),
    }), updates);

    this._pendingOperations.forEach((operation) => {
      const index = updates.fields.indexOf(`${operation.field} = ?`);
      if (index >= 0) {
        updates.fields[index] = `${operation.field} = array_unique(${operation.field}, ?)`;
        updates.values[index] = operation.data;
      }
    });

    const base = concat(
      [`update ${this.tableName} set`],
      [join(updates.fields, ', ')],
      Model.createClause(filter)
    );

    return [
      join(base, ' '),
      concat(updates.values || [], filter.arguments || []),
    ];
  }

  raw() {
    return this.fromDb(this._data);
  }

  static convertType(_value, operator) {
    const value = moment.isDate(_value) || moment.isMoment(_value)
      ? moment.tz(_value, this.timezone).toDate()
      : _value;

    if (is.array(value) && operator === 'in') {
      const elements = value
        .map(item => (is.string(item) ? `'${item}'` : item))
        .join(', ');

      return `(${elements})`;
    }

    return [value];
  }

  static createFilter(filter) {
    // TODO: why do we use ARGUMENTS as an identifier?
    const query = {
      where: [],
      arguments: [],
      order: [],
    };

    reduce(filter.where, (result, _value, key) => {
      let value = _value;
      let operator = '=';
      let condition;
      let escapedValue;

      if (is.array(_value)) {
        operator = _value[0].toLowerCase();
        value = _value[1];
      }

      if (operator === 'in') {
        escapedValue = Model.convertType(value, operator);
        condition = `${key} ${operator} ${escapedValue}`;
        escapedValue = null;
      } else {
        condition = `${key} ${operator} ?`;
        escapedValue = Model.convertType(value, operator);
      }

      result.where = concat(result.where, condition);
      result.arguments = escapedValue !== null
        ? concat(result.arguments, escapedValue)
        : result.arguments;

      return result;
    }, query);

    reduce(filter.order, (result, _value) => {
      let value = _value.toLowerCase();

      if (value[0] === '-') {
        value = `${value.replace('-', '')} desc`;
      } else if (value.indexOf('asc') < 0) {
        value = `${value} asc`;
      }

      result.order = concat(result.order, value);
      return result;
    }, query);

    if (filter.start) {
      query.start = filter.start;
    }

    if (filter.limit) {
      query.limit = filter.limit;
    }

    return query;
  }

  static createClause(filter) {
    const base = [];
    if (filter.where && filter.where.length > 0) {
      const where = map(filter.where, clause => (`(${clause})`));
      base.push(`where ${join(where, ' and ')}`);
    }
    if (filter.order && filter.order.length > 0) {
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

  static create(db, Ctor, data) {
    return new Proxy(new Ctor(db, data), Model.Proxy);
  }

  static single(db, Ctor, id) {
    const tableName = `${db._namespace}.${Ctor.tableName}`;
    return db
      .execute(`select * from ${tableName} where id = ? limit 1`, [id])
      .then((result) => {
        if (result.json.length === 1) {
          return new Proxy(new Ctor(db, result.json[0]).old(), Model.Proxy);
        }

        throw new Errors.Argument(`Object with specified ID ${id} not found`);
      });
  }

  static filter(db, Ctor, filter) {
    const tableName = `${db._namespace}.${Ctor.tableName}`;
    const where = Model.createFilter(filter);
    const query = Model.createSelect(tableName, where);

    return Promise
      .resolve(db.execute(query[0], query[1]))
      .get('json')
      .map(item => new Proxy(new Ctor(db, item).old(), Model.Proxy));
  }

  static removeByQuery(db, Ctor, filter) {
    const tableName = `${db._namespace}.${Ctor.tableName}`;
    const where = Model.createFilter(filter);
    const query = Model.createDelete(tableName, where);

    return db
      .execute(query[0], query[1])
      .then((result) => {
        // sadly, rowcount means nothing for delete queries, just ignore it :(
        const rowcount = result.rowcount || 0;
        return rowcount >= 0 ? rowcount : 0;
      });
  }

  // TODO: apply sharding and replication options
  static migrate(db, Ctor) {
    const tableName = `${db._namespace}.${Ctor.tableName}`;
    const cols = Object.keys(Ctor.schema).map(key => `${key} ${Ctor.schema[key]}`);
    const statement = 'CREATE TABLE IF NOT EXISTS %s (%s) CLUSTERED INTO 1 SHARDS WITH (number_of_replicas=0)';
    return db.execute(format(statement, tableName, cols), []);
  }

  static cleanup(db, Ctor) {
    const tableName = `${db._namespace}.${Ctor.tableName}`;
    return db.execute(format('DROP TABLE IF EXISTS %s', tableName), []);
  }
}

Model.Proxy = {
  get(target, name) {
    if (target[name]) return target[name];
    if (!target._valid) throw new Errors.InvalidOperationError(`Instance is invalid, cannot get ${name}`);
    return name in target._data ? target._data[name] : null;
  },

  set(target, name, value) {
    if (target[name]) {
      target[name] = value;
      return true;
    }

    if (!target._valid) throw new Errors.InvalidOperationError(`Instance is invalid, cannot set ${name}`);

    if (name in target._data) {
      target._data[name] = value;
      target._dirty = true;
      return true;
    }

    return false;
  },
};

module.exports = exports = Model;
