const Promise = require('bluebird');
const Errors = require('common-errors');
const RRule = require('rrule').RRule;
const moment = require('moment-timezone');
const assert = require('assert');
const is = require('is');

const { coroutine } = require('../utils/getMethods');

const BannedRRuleFreq = {
  [RRule.HOURLY]: true,
  [RRule.MINUTELY]: true,
  [RRule.SECONDLY]: true,
  [RRule.YEARLY]: true,
};

class Event {
  constructor(storage) {
    coroutine(this);
    this.storage = storage;
    this.log = storage.log;
  }

  static parseRRule(data) {
    const opts = RRule.parseString(data.rrule);
    const now = moment();

    // check frequency
    assert.ifError(BannedRRuleFreq[opts.freq], 'FREQ must be one of WEEKLY, MONTHLY or undefined');

    // make sure count is not > 365 and if not provided set to MAX the event count
    if (!opts.count || opts.count > 365) {
      opts.count = 365;
    }

    assert(
      moment(opts.until).subtract(1, 'year').isBefore(now),
      'UNTIL must be within a year from now'
    );

    assert(
      moment(opts.dtstart).add(1, 'year').isAfter(now),
      'DTSTART must be without the last year'
    );

    // do not cache RRule, we are not likely to work with same events
    // also do not make it enumerable, so that we don't need to omit it later
    Object.defineProperty(data, 'parsedRRule', {
      value: new RRule(opts, { noCache: true }),
    });

    return data;
  }

  * create(data) {
    this.log.info('creating data', data);

    // we have 2 tables:
    // 1. table of events - consists raw data with rrule
    // 2. table of expanded event time frames - it's a foreign key of id with cascade on delete
    // on update we manually recalculate all the data ranges, remove old ones & insert new ones
    return yield Promise
      .bind(this.storage, data)
      .then(Event.parseRRule)
      .catch((e) => {
        throw new Errors.HttpStatusError(400, `Invalid RRule: ${e.message}`);
      })
      .then(this.storage.createEvent);
  }

  * update(id, owner, event) {
    this.log.info('updating event', event);

    // simple case of just updating metadata for an event
    if (is.undefined(event.rrule)) {
      return yield this.storage.updateEventMeta(id, owner, event);
    }

    // a more complex case where we need to recalculate all
    // time-spans, this includes removing earlier time-spans
    // and building new ones as rrule has changed
    return yield Promise
      .bind(this.storage, event)
      .then(Event.parseRRule)
      .catch((e) => {
        throw new Errors.HttpStatusError(400, `Invalid RRule: ${e.message}`);
      })
      .return([id, owner, event])
      .spread(this.storage.updateEvent);
  }

  * remove(id, owner) {
    this.log.warn('removing event', id, owner);
    return yield this.storage.removeEvent(id, owner);
  }

  * list(data) {
    return yield this.storage.getEvents(data);
  }

  * get(id) {
    return yield this.storage.getEvent(id);
  }

  // TODO: not working, implement it later
  * subscribe(data) {
    return yield this.storage.subscribeToEvent(data);
  }
}

module.exports = Event;
