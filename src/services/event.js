const Promise = require('bluebird');
const Errors = require('common-errors');
const moment = require('moment-timezone');
const assert = require('assert');
const is = require('is');
const { RRule } = require('rrule');
const { coroutine } = require('../utils/getMethods');
const { zones: cachedZones, MomentTimezone } = require('../zones');

const zones = Object.create(null);
const aggregateZones = (acc, zone) => { acc[zone] = true; return acc; };
moment.tz.names().reduce(aggregateZones, zones);

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
    // const now = moment();

    // check frequency
    assert(!BannedRRuleFreq[opts.freq], 'FREQ must be one of WEEKLY, MONTHLY or undefined');

    // make sure count is not > 365 and if not provided set to MAX the event count
    if (!opts.count || opts.count > 365) {
      opts.count = 365;
    }

    const until = moment(opts.until);
    const dtstart = moment(opts.dtstart);

    // ensure that until > dtstart and is not too far in the past
    assert(until.isAfter(dtstart), 'DTSTART must be before UNTIL');
    // assert(until.subtract(1, 'year').isBefore(now), 'UNTIL must be within a year from now');
    // assert(dtstart.add(1, 'year').isAfter(now), 'DTSTART must be within the last year');

    const { tz } = data;
    if (tz) {
      assert(zones[tz], `${tz} must be one of the supported by moment-timezone`);
      if (cachedZones[tz]) {
        opts.tzid = cachedZones[tz];
      } else {
        opts.tzid = cachedZones[tz] = new MomentTimezone(tz);
      }

      // set to the specified offset
      const adjustedStartDate = dtstart
        .utcOffset(opts.tzid.offset(dtstart.valueOf()));

      // re-adjust based on start date
      opts.byhour = adjustedStartDate.hours();
      opts.byminute = adjustedStartDate.minute();
      opts.bysecond = 0;
      opts.dtstart = adjustedStartDate.startOf('day').toDate();
    }

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
    // simple case of just updating metadata for an event
    // in that case duration is not specified either
    if (is.undefined(event.rrule)) {
      this.log.info('updating event meta', event);
      event.owner = owner;
      return yield this.storage.updateEventMeta(id, event);
    }

    // validation rules require the duration to be specified
    // a more complex case where we need to recalculate all
    // time-spans, this includes removing earlier time-spans
    // and building new ones as rrule has changed
    this.log.info('updating complete event', event);
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

  * subscribe(id, username) {
    return yield this.storage.subscribeEvent(id, username);
  }

  * unsubscribe(id, username) {
    return yield this.storage.unsubscribeEvent(id, username);
  }

  * listSubs(data) {
    return yield this.storage.listEventSubs(data);
  }

  * listTags(data) {
    return yield this.storage.getEventTags(data);
  }
}

module.exports = Event;
