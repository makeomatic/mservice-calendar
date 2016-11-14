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

        const spans = events.map((span) => {
          const startTime = span.toISOString();
          const endTime = moment(span).add(duration, 'minutes').toISOString();

          return {
            event_id: id,
            start_time: startTime,
            end_time: endTime,
            period: `[${startTime},${endTime})`,
          };
        });

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

  getEvents({ owner, tags, hosts, startTime, endTime }) {
    const knex = this.client;

    this.log.debug('querying %s between %s and %s', owner, startTime, endTime);

    const query = knex
      .select([
        'id',
        'title',
        'description',
        'rrule',
        'duration',
        'tags',
        'hosts',
        knex.raw(`array_to_json(array_agg("${EVENT_SPANS_TABLE}"."start_time")) as start_time`),
      ])
      .from(EVENT_TABLE)
      .joinRaw(`LEFT JOIN ${EVENT_SPANS_TABLE} on (`
        + `${EVENT_TABLE}.id = ${EVENT_SPANS_TABLE}.event_id AND `
        + `${EVENT_SPANS_TABLE}.period && tsrange(TIMESTAMP '${startTime}', TIMESTAMP '${endTime}')`
        + ')'
      )
      .where(`${EVENT_TABLE}.owner`, owner)
      .groupByRaw(`${EVENT_TABLE}.id`)
      .orderBy(knex.raw(`MIN("${EVENT_SPANS_TABLE}"."start_time")`), 'asc')
      .orderBy('id', 'asc');

    // add this to query
    if (tags) {
      query.where(`${EVENT_TABLE}.tags`, '&&', tags);
    }

    if (hosts) {
      query.where(`${EVENT_TABLE}.hosts`, '&&', hosts);
    }

    return query;
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
