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
  }

  save() {
    if (this._newInstance) {
      this._newInstance = false;
      this._dirty = false;
      return Promise.resolve(this.db.insert(this.tableName, this._data)).return(this);
    } else if (this._dirty) {
      this._dirty = false;
      const update = omitBy(this._data, (value, key) => (key === 'id' || value === null));
      const query = this.createUpdate(update, this.tableName, this._data.id);
      return Promise.resolve(this.db.execute(query)).return(this);
    }

    return Promise.resolve(this);
  }

  update(data) {
    this._data = assign({}, this._data, data);
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
          return JSON.stringify(value.map(Model.convertType));
        } else if (value instanceof Date) {
          // TODO: weird?
          return `'${moment(value).format()}'`;
        }

        return 'null';
      default:
        return 'null';
    }
  }

  static createFilter(filter) {
    return reduce(filter.where, (result, _value, key) => {
      let operator = '=';
      let value = _value;
      if (Array.isArray(value)) {
        operator = value[0];
        value = value[1];
      }
      const condition = `${key} ${operator} ?`;
      const escapedValue = Model.convertType(value);

      return {
        command: concat(result.command, condition),
        arguments: concat(result.arguments, escapedValue),
      };
    }, { command: [], arguments: [] });
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

  static create(db, Ctor, data) {
    return new Proxy(new Ctor(db, data), Model.Proxy);
  }

  static single(db, Ctor, id) {
    const tableName = `${db._namespace}.${Ctor.tableName}`;
    return db.execute(`select * from ${tableName} where id = ? limit 1`, [id]).then((result) => {
      if (result.json.length === 1) {
        return new Proxy(new Ctor(db, result.json[0]).old(), Model.Proxy);
      }

      throw new Errors.Argument('Object with specified ID not found');
    });
  }

  static filter(db, Ctor, filter) {
    const tableName = `${db._namespace}.${Ctor.tableName}`;
    const where = Model.createFilter(filter);
    const query = Model.createSelect(tableName, where);
    return db.execute(query[0], query[1]).then((result) => {
      return result.json.map((item) => {
        return new Proxy(new Ctor(db, item).old(), Model.Proxy);
      });
    });
  }

  static remove(db, Ctor, filter) {
    const tableName = `${db._namespace}.${Ctor.tableName}`;
    const where = Model.createFilter(filter);
    const query = Model.createDelete(tableName, where);
    return db.execute(query[0], query[1]).then((result) => {
            // sadly, rowcount means nothing for delete queries, just ignore it :(
      const rowcount = result.rowcount || 0;
      return rowcount >= 0 ? rowcount : 0;
    });
  }

  static migrate(db, Ctor) {
    const tableName = `${db._namespace}.${Ctor.tableName}`;
    const schema = { [tableName]: Ctor.schema };
    return db.create(schema);
  }

  static cleanup(db, Ctor) {
    const tableName = `${db._namespace}.${Ctor.tableName}`;
    return db.drop(tableName);
  }
}

Model.Proxy = {
  get(target, name) {
    if (target[name]) return target[name];
    return name in target._data ? target._data[name] : null;
  },

  set(target, name, value) {
    if (target[name]) {
      target[name] = value;
      return true;
    }

    if (name in target._data) {
      target._data[name] = value;
      target._dirty = true;
      return true;
    }

    return false;
  },
};

module.exports = exports = Model;
