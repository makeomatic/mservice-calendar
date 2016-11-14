const Promise = require('bluebird');
const Errors = require('common-errors');
const RRule = require('rrule').RRule;
const moment = require('moment-timezone');
const assert = require('assert');

const { coroutine } = require('../utils/getMethods');
const { map, compact, concat, merge } = require('lodash');

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

  * update(data) {
    const instance = yield this.storage.getEvent(data.id);

    if (instance.owner !== data.auth) {
      throw new Errors.NotPermitted('You\'re not permitted to edit this event');
    }

    if (!Event.isEditable(instance)) {
      throw new Errors.Validation('Past events cannot be edited');
    }

    const { event } = data;
    const notify =
      (event.recurring === true && event.rrule !== instance.rrule)
      || event.start_time !== instance.start_time
      || event.end_time !== instance.end_time;

    const updated = yield this.storage.updateEvent(data.id, event);

    return notify && (updated > 0); // notify if update succeeded
  }

  * remove(data) {
    if (data.id === undefined && data.where === undefined) {
      throw new Errors.Argument('Instance ID or filter must be provided');
    }

    let notifications = [];

    if (data.id) {
      const instance = yield this.storage.getEvent(data.id);

      if (instance.owner !== data.auth) {
        throw new Errors.NotPermitted('You\'re not permitted to delete this event');
      }

      if (!Event.isEditable(instance)) {
        throw new Errors.Validation('Past events cannot be edited');
      }

      if (instance.notifications) {
        notifications = concat(notifications, instance);
      }

      yield this.storage.removeEvents({ where: { id: data.id } });
    } else {
      const filterQuery = merge({}, data, { where: { owner: data.auth } });
      const items = yield this.storage.getEvents(filterQuery);
      const toDelete = map(items, (item) => {
        if (Event.isEditable(item) && item.owner === data.auth) {
          if (item.notifications) {
            notifications = concat(notifications, item);
          }
          return item.id;
        }

        return null;
      });
      const ids = compact(toDelete);
      if (ids.length > 0) {
        yield this.storage.removeEvents({ where: { id: ['in', ids] } });
      }
    }

    return notifications;
  }

  * list(data) {
    return yield this.storage.getEvents(data);
  }

  * single(data) {
    if (data.id === undefined) {
      throw new Errors.Argument('Instance ID must be provided');
    }

    return yield this.storage.getEvent(data.id);
  }

  * subscribe(data) {
    return yield this.storage.subscribeToEvent(data);
  }

  static isEditable(instance) {
    // check that this event is running before trying to update
    const now = moment();
    if (!instance.recurring) {
      // simple check that event didn't end
      return now.isBefore(moment(instance.end_time));
    }

    const rules = RRule.fromString(instance.rrule);
    return rules.before(now.toDate()) === null;
  }
}

module.exports = Event;
