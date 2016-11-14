const EventModel = require('../models/events');
const { forEach, isArray } = require('lodash');

function createFilter(filter, query) {
  if (filter.limit) query.limit(filter.limit);

  if (filter.start) query.offset(filter.start);

  if (filter.order) {
    forEach(filter.order, (direction, field) => {
      query.orderBy(field, direction);
    });
  }

  if (filter.where) {
    forEach(filter.where, (operation, field) => {
      if (isArray(operation)) {
        query.where(field, operation[0], operation[1]);
      } else {
        query.where(field, operation);
      }
    });
  }

  return query;
}

class Storage {
  constructor(knex) {
    const client = this.client = knex;

    /**
     * Perform an "Upsert" using the "INSERT ... ON CONFLICT ... " syntax in PostgreSQL 9.5
     * @link http://www.postgresql.org/docs/9.5/static/sql-insert.html
     * @author https://github.com/plurch
     *
     * @param {string} tableName - The name of the database table
     * @param {string} conflictTarget - The column in the table which has a unique index constraint
     * @param {Object} itemData - a hash of properties to be inserted/updated into the row
     * @returns {Promise} - A Promise which resolves to the inserted/updated row
     */
    client.upsertItem = function upsertItem(tableName, conflictTarget, itemData) {
      const targets = conflictTarget.split(', ');
      const exclusions = Object.keys(itemData)
        .filter(c => targets.indexOf(c) === -1)
        .map(c => client.raw('?? = EXCLUDED.??', [c, c]).toString())
        .join(', ');

      const insertString = client(tableName).insert(itemData).toString();
      const conflictString = client
        .raw(` ON CONFLICT (${conflictTarget}) DO UPDATE SET ${exclusions} RETURNING *;`)
        .toString();
      const query = (insertString + conflictString).replace(/\?/g, '\\?');

      return client.raw(query).then(result => result.rows[0]);
    };
  }

  createEvent(data) {
    return this.client(EventModel.tableName).insert(data);
  }

  updateEvent(id, data) {
    return this.client(EventModel.tableName).where({ id }).update(data);
  }

  getEvent(id) {
    return this.client(EventModel.tableName).where({ id }).then((results) => {
      if (results.length > 0) {
        return results[0];
      }

      throw new Error(`Event with id ${id} not found`);
    });
  }

  getEvents(filter) {
    const query = this.client(EventModel.tableName);
    return createFilter(filter, query);
  }

  removeEvents(filter) {
    const query = this.client(EventModel.tableName);
    return createFilter(filter, query).del();
  }

  subscribeToEvent(data) {
    let query;
    const subscriber = `{${data.subscriber}}`;
    if (!data.notify) {
      const sql = `update ${EventModel.tableName} set subscribers = subscribers || ? where id = ?`;
      query = this.client.raw(sql, [subscriber, data.event]);
    } else {
      const sql = `update ${EventModel.tableName} set notifications = notifications || ?, subscribers = subscribers || ? where id = ?`;
      query = this.client.raw(sql, [subscriber, subscriber, data.event]);
    }
    return query;
  }
}

module.exports = Storage;
