/**
 * services/storage.js
 * @flow
 */

const Promise = require('bluebird');
const {
  EVENT_TABLE,
  EVENT_SPANS_TABLE,
  EVENT_FIELDS,
  EVENT_TAGS_TABLE,
  EVENT_SUBS_TABLE,
} = require('../constants');
const { pick } = require('lodash');
const moment = require('moment-timezone');
const Errors = require('common-errors');

const defaultTZ = moment.tz.guess();
const isOverlapping = { routine: 'check_exclusion_or_unique_constraint' };
const timestampRegexp = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g;
const momentFormat = 'YYYY-MM-DD HH:mm:ss';
const overlapError = (a, b) =>
  `You want to create an event starting at ${a}, but it overlaps with another one at ${b}`;

class Storage {
  log: Object;
  client: any;

  constructor(knex: any, logger: Object) {
    this.client = knex;
    this.log = logger;
  }

  static generateSpans(id: number, data: Object): Array<Object> {
    const { parsedRRule, duration, owner } = data;
    const events = parsedRRule.all();
    return events.map((span) => {
      const startTime = span.toISOString();
      const endTime = moment(span).add(duration, 'minutes').toISOString();

      return {
        event_id: id,
        owner,
        start_time: startTime,
        end_time: endTime,
        period: `[${startTime},${endTime})`,
      };
    });
  }

  static HandleOverlap(e: Object, tz: String = defaultTZ) {
    // detail: 'Key (owner, period)=(admin@foo.com, ["2016-09-26 21:00:00","2016-09-26 21:30:00"))
    // conflicts with existing key (owner, period)=(admin@foo.com, ["2016-09-26 21:00:00","2016-09-26 21:30:00")).',
    const [one, , two] = e.detail.match(timestampRegexp);
    const events = [two, one].map(time => moment(time, momentFormat).tz(tz).format('llll'));
    throw new Errors.ValidationError(overlapError(...events));
  }

  /**
   * Inserts event data into the PGSQL database
   * Expands
   */
  createEvent(data: Object) {
    // won't be more than 365 e vents due to constraints we have
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

        // embed id into the resulting event
        resultingEvent.id = id;

        // generate spans
        const spans = Storage.generateSpans(id, data);
        this.log.debug('generated spans %d', spans.length);

        return knex(EVENT_SPANS_TABLE)
          .transacting(trx)
          .insert(spans)
          .return(resultingEvent);
      })
      .tap(trx.commit)
      .catch(isOverlapping, e => Storage.HandleOverlap(e, data.tz))
      .catch(e => e.name !== 'ValidationError', trx.rollback)
    ));
  }

  updateEventMeta(id: number, data: Object, trx: Object | boolean = false) {
    const knex = this.client;

    // query builder
    let query = knex(EVENT_TABLE);
    const resultingEvent = pick(data, EVENT_FIELDS);

    if (trx) {
      query = query.transacting(trx);
    }

    return query
      .where({ id, owner: data.owner })
      .update(resultingEvent)
      .then((results) => {
        if (results.length === 0) {
          throw new Errors.HttpStatusError(404, `event ${id} not found for owner ${data.owner}`);
        }

        // all OK
        return null;
      });
  }

  updateEvent(id: number, owner: string, data: Object) {
    data.owner = owner;

    const knex = this.client;
    const spans = Storage.generateSpans(id, data);

    this.log.debug('generated spans %d', spans.length);

    return knex.transaction(trx => (
      Promise.join(
        this.updateEventMeta(id, data, trx),
        knex(EVENT_SPANS_TABLE).transacting(trx).where('event_id', id).del()
      )
      .then(() => knex(EVENT_SPANS_TABLE).transacting(trx).insert(spans))
      .tap(trx.commit)
      .catch(isOverlapping, e => Storage.HandleOverlap(e, data.tz))
      .catch(e => e.name !== 'HttpStatusError', trx.rollback)
    ));
  }

  getEvent(id: number) {
    return this.client(EVENT_TABLE).where({ id }).then((results) => {
      if (results.length > 0) {
        return results[0];
      }

      throw new Errors.HttpStatusError(404, `Event with id ${id} not found`);
    });
  }

  getEvents(filter: Object) {
    const { owner, tags, hosts } = filter;
    const knex = this.client;

    const startTime = new Date(filter.startTime).toISOString();
    const endTime = new Date(filter.endTime).toISOString();

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
        `${EVENT_TABLE}.owner`,
        knex.raw(`array_to_json(array_agg("${EVENT_SPANS_TABLE}"."start_time")) as start_time`),
      ])
      .from(EVENT_TABLE)
      .joinRaw(`INNER JOIN ${EVENT_SPANS_TABLE} on (`
        + `${EVENT_TABLE}.id = ${EVENT_SPANS_TABLE}.event_id AND `
        + `${EVENT_SPANS_TABLE}.period && tsrange(TIMESTAMP '${startTime}', TIMESTAMP '${endTime}')`
        + ')'
      );

    // filter clauses
    if (owner) {
      query.where(`${EVENT_TABLE}.owner`, owner.toLowerCase());
    }

    // add this to query
    if (tags) {
      query.where(`${EVENT_TABLE}.tags`, '&&', tags);
    }

    if (hosts) {
      query.where(`${EVENT_TABLE}.hosts`, '&&', hosts);
    }

    // groupping and order closes
    query
      .groupByRaw(`${EVENT_TABLE}.id`)
      .orderBy(knex.raw(`MIN("${EVENT_SPANS_TABLE}"."start_time")`), 'asc')
      .orderBy('id', 'asc');

    return query;
  }

  // EVENT_SPANS_TABLE will be deleted using foreign key CASCADE on DELETE
  removeEvent(filter: Object) {
    const { id, owner } = filter;
    const knex = this.client;
    return knex(EVENT_TABLE).where({ id, owner }).del();
  }

  subscribeEvent(id, username) {
    const knex = this.client;
    return knex(EVENT_SUBS_TABLE)
      .insert({ event_id: id, username })
      .return(id)
      .catch({ routine: '_bt_check_unique' }, (err) => {
        throw new Errors.NotPermittedError('user has already subscribed to the event', err);
      })
      .catch({ constraint: 'events_subs_event_id_foreign' }, (err) => {
        throw new Errors.NotFoundError('event not found', err);
      });
  }

  unsubscribeEvent(id, username) {
    const knex = this.client;
    return knex(EVENT_SUBS_TABLE)
      .where({ event_id: id, username })
      .del()
      .then((count) => {
        if (count === 0) {
          throw new Errors.NotPermittedError('user is not subscribed to this event');
        }
        return id;
      });
  }

  listEventSubs(filters) {
    let startTime = filters.startTime ? moment.utc(filters.startTime) : moment.utc();
    let endTime = filters.endTime ? moment.utc(filters.endTime) : moment.utc().add(1, 'years');

    startTime = startTime.toISOString();
    endTime = endTime.toISOString();

    const { id, username } = filters;
    const knex = this.client;
    const query = knex
      .select([
        `${EVENT_TABLE}.id`,
        `${EVENT_TABLE}.title`,
        `${EVENT_TABLE}.description`,
        `${EVENT_TABLE}.owner`,
        `${EVENT_TABLE}.rrule`,
        `${EVENT_TABLE}.duration`,
        `${EVENT_TABLE}.tags`,
        `${EVENT_TABLE}.hosts`,
        `${EVENT_SUBS_TABLE}.username`,
        `${EVENT_SUBS_TABLE}.created_at as createdAt`,
      ])
      .from(EVENT_SUBS_TABLE)
      .join(EVENT_TABLE, `${EVENT_SUBS_TABLE}.event_id`, '=', `${EVENT_TABLE}.id`)
      .joinRaw('INNER JOIN (' +
        `SELECT event_id FROM ${EVENT_SPANS_TABLE} ` +
        `WHERE period && tsrange(TIMESTAMP '${startTime}', TIMESTAMP '${endTime}') ` +
        `GROUP BY event_id) ${EVENT_SPANS_TABLE} on (${EVENT_SPANS_TABLE}.event_id = ${EVENT_TABLE}.id)`);

    if (id) {
      query.where(`${EVENT_SUBS_TABLE}.event_id`, id);
    }

    if (username) {
      query.where(`${EVENT_SUBS_TABLE}.username`, username);
    }

    query
      .orderBy(`${EVENT_SUBS_TABLE}.event_id`, 'asc');

    return query;
  }

  getEventTags(filter) {
    const knex = this.client;
    const isActive = filter.active;
    const startTime = filter.startTime || new Date().toISOString();
    const endTime = filter.endTime || moment().add(2, 'month').toISOString();

    // TODO: assert that we do not request something 1 year from now
    // 1. select available tags
    // 2. filter by any events with the same active tag and return response
    const query = knex
      .select([
        `${EVENT_TAGS_TABLE}.id as id`,
        'eng',
        'icon',
        'cover',
        'priority',
        'section',
      ])
      .from(EVENT_TAGS_TABLE);

    if (isActive) {
      query
        .joinRaw(`INNER JOIN ${EVENT_TABLE} on ${EVENT_TABLE}.tags @> ARRAY[${EVENT_TAGS_TABLE}.id]`)
        .joinRaw(`INNER JOIN ${EVENT_SPANS_TABLE} on (`
          + `${EVENT_TABLE}.id = ${EVENT_SPANS_TABLE}.event_id AND `
          + `${EVENT_SPANS_TABLE}.period && tsrange(TIMESTAMP '${startTime}', TIMESTAMP '${endTime}')`
          + ')'
        )
        .groupByRaw(`${EVENT_TAGS_TABLE}.id`);
    }

    query.orderBy('priority', 'desc');

    return query;
  }
}

module.exports = Storage;
