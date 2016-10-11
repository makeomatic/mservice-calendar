const Errors = require('common-errors');
const RRule = require('rrule').RRule;
const moment = require('moment-timezone');

const { map, compact, concat, merge } = require('lodash');

class Event {
  constructor(storage) {
    this.storage = storage;
  }

  * create(data) {
    if (data.recurring) {
      // if missing rrule, throw
      if (data.rrule === undefined) {
        throw new Errors.Argument('Recurring rules require rrule attribute');
      }

      if (data.duration === undefined) {
        throw new Errors.Argument('Recurring rules require duration attribute');
      }

      // parse rrule to see if it's correct
      try {
        RRule.parseString(data.rrule);
      } catch (e) {
        throw new Errors.Argument('Invalid rrule', e);
      }
    }

    return yield this.storage.createEvent(data);
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
