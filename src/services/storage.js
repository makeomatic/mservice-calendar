const { EVENT_TABLE, EVENT_SPANS_TABLE, EVENT_FIELDS, EVENT_TYPE } = require('../constants');
const { forEach, isArray, pick } = require('lodash');
const { transformModel } = require('../utils/transform');
const moment = require('moment');

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
  constructor(knex, logger) {
    this.client = knex;
    this.log = logger;
  }

  /**
   * Inserts event data into the PGSQL database
   * Expands
   */
  createEvent(data) {
    // won't be more than 365 events due to constraints we have
    const rrule = data.parsedRRule;
    const events = rrule.all();
    const duration = data.duration;
    const knex = this.client;
    const resultingEvent = pick(data, EVENT_FIELDS);

    this.log.debug('creating event', data);

    return knex.transaction(trx => (
      knex(EVENT_TABLE)
      .transacting(trx)
      .returning('id')
      .insert(resultingEvent)
      .spread((id) => {
        this.log.debug('created event', id);

        const spans = events.map(span => ({
          event_id: id,
          start_time: span.toISOString(),
          end_time: moment(span).add(duration, 'minutes').toISOString(),
        }));

        // embed id into the resulting event
        resultingEvent.id = id;

        return knex(EVENT_SPANS_TABLE)
          .transacting(trx)
          .insert(spans)
          .return(transformModel(resultingEvent, EVENT_TYPE));
      })
      .tap(trx.commit)
      .catch(trx.rollback)
    ));
  }

  updateEvent(id, data) {
    // TODO: if rrule changed we need to regenerate spans
    return this.client(EVENT_TABLE).where({ id }).update(data);
  }

  getEvent(id) {
    return this.client(EVENT_TABLE).where({ id }).then((results) => {
      if (results.length > 0) {
        return results[0];
      }

      throw new Error(`Event with id ${id} not found`);
    });
  }

  getEvents(filter) {
    const query = this.client(EVENT_TABLE);
    return createFilter(filter, query);
  }

  removeEvents(filter) {
    const query = this.client(EVENT_TABLE);
    return createFilter(filter, query).del();
  }

  subscribeToEvent(data) {
    let query;
    const subscriber = `{${data.subscriber}}`;
    if (!data.notify) {
      const sql = `update ${EVENT_TABLE} set subscribers = subscribers || ? where id = ?`;
      query = this.client.raw(sql, [subscriber, data.event]);
    } else {
      const sql = `update ${EVENT_TABLE} set notifications = notifications || ?, subscribers = subscribers || ? where id = ?`;
      query = this.client.raw(sql, [subscriber, subscriber, data.event]);
    }
    return query;
  }
}

module.exports = Storage;
