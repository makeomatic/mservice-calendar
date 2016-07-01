const Controller = require('./controller');

const Model = require('../models/model');
const EventModel = require('../models/events');

const Promise = require('bluebird');
const Errors = require('common-errors');
const RRule = require('rrule').RRule;
const moment = require('moment-timezone');

const map = require('lodash/map');
const concat = require('lodash/concat');
const filter = require('lodash/filter');
const reduce = require('lodash/reduce');
const assign = require('lodash/assign');

class EventController extends Controller {
    constructor(...args) {
        super(...args);
    }

    create(data) {
        return this.wrap(data, 'create', function* createUnit(data) {
            const validated = yield this.validate('event', data);

            if (validated.recurring) {
                // if missing rrule, throw
                if (validated.rrule === undefined) {
                    throw new Errors.Argument('Recurring rules require rrule attribute');
                }

                if (validated.duration === undefined) {
                    throw new Errors.Argument('Recurring rules require duration attribute');
                }

                // parse rrule to see if it's correct
                try {
                    RRule.parseString(validated.rrule);
                } catch (e) {
                    throw new Errors.Argument('Invalid rrule', e);
                }
            }

            if (validated.tags === undefined) {
                validated.tags = [];
            }

            const instance = Model.create(this.db, EventModel, validated);
            return yield instance.save();
        });
    }

    update(data) {
        return this.wrap(data, 'update', function* updateUnit(data) {
            const validated = yield this.validate('event.update', data);
            const instance = yield Model.single(this.db, EventModel, validated.id);
            if (!EventController.isEditable(instance)) {
                throw new Errors.Validation('Past events can not be edited');
            }
            const notify = validated.recurring === true && validated.rrule != instance.rrule ||
                validated.start_time != instance.start_time ||
                validated.end_time != instance.end_time;

            instance.update(validated);
            const updated = yield instance.save();

            return {
                instance: updated,
                notify: notify
            }
        });
    }

    remove(data) {
        return this.wrap(data, 'remove', function* removeUnit(data) {
            const validated = yield this.validate('delete', data);

            if (validated.id === undefined && validated.where === undefined) {
                throw new Errors.Argument('Instance ID or filter must be provided');
            }

            let notifications = [];

            if (validated.id) {
                const instance = yield Model.single(this.db, EventModel, validated.id);
                if (!EventController.isEditable(instance)) {
                    throw new Errors.Validation('Past events can not be edited');
                }
                if (instance.notifications) {
                    notifications = concat(notifications, instance.raw());
                }
                yield instance.remove();
            } else {
                const items = yield Model.filter(this.db, EventModel, validated);
                const toDelete = yield map(items, function(item) {
                    if (EventController.isEditable(item)) {
                        if (item.notifications) {
                            notifications = concat(notifications, item.raw());
                        }
                        return Promise.resolve(item.remove()).return('OK');
                    } else {
                        return Promise.resolve('Past events can not be edited');
                    }
                });
            }

            return notifications;
        });
    }

    list(data) {
        return this.wrap(data, 'list', function* singleUnit(data) {
            const validated = yield this.validate('list', data);
            return yield Model.filter(this.db, EventModel, validated);
        });
    }

    single(data) {
        return this.wrap(data, 'single', function* singleUnit(data) {
            if (data.id === undefined) {
                throw new Errors.Argument('Instance ID must be provided');
            }

            return yield Model.single(this.db, EventModel, data.id);
        });
    }

    calendar(data) {
        return this.wrap(data, 'calendar', function* calendarUnit(data) {
            const validated = yield this.validate('calendar', data);
            // select all events
            const events = yield this.list({where: {}});
            // for each event build it's schedule
            return reduce(events, (acc, event) => {
                const start = moment.tz(validated.start, event.timezone);
                const end = moment.tz(validated.end, event.timezone);

                const start_event = moment.tz(event.start_time, event.timezone);
                const end_event = moment.tz(event.end_time, event.timezone);

                let duration;
                if (event.duration) {
                    duration = moment.duration(event.duration);
                } else {
                    duration = moment.duration(end_event.diff(start_event));
                }

                let schedule;
                if (event.recurring) {
                    const rrule = RRule.fromString(event.rrule);
                    // include time frame borders
                    let rrule_start, rrule_end;
                    if (start.isBefore(start_event)) {
                        rrule_start = start_event.clone();
                    } else {
                        rrule_start = start.clone();
                    }
                    if (end.isAfter(end_event)) {
                        rrule_end = end_event.clone();
                    } else {
                        rrule_end = end.clone();
                    }
                    schedule = rrule.between(rrule_start.toDate(), rrule_end.toDate(), true);
                    // convert schedules to desired format: append start and end for every event
                    schedule = map(schedule, entry => {
                        const time = moment.tz(entry, event.timezone);
                        const start_entry = time.clone().hours(start_event.hours()).minutes(start_event.minutes()).seconds(0);
                        const end_entry = start_entry.clone().add(duration).seconds(0);
                        return [start_entry.valueOf(), end_entry.valueOf()];
                    });
                } else {
                    // only include event if it happens inside desired time frame
                    if (start_event.isAfter(start) && end_event.isBefore(end)) {
                        schedule = [[start_event.valueOf(), end_event.valueOf()]];
                    } else {
                        schedule = null;
                    }
                }

                if (schedule != null) {
                    const result = {
                        [event.id]: {
                            id: event.id,
                            title: event.title,
                            tz: event.timezone,
                            schedule
                        }
                    };

                    return assign(acc, result);
                }
            }, {});
        });
    }

    subscribe(data) {
        return this.wrap(data, 'subscribe', function* calendarUnit(data) {
            const validated = yield this.validate('subscribe', data);
            const instance = yield Model.single(this.db, EventModel, validated.event);
            if (validated.notify) {
                instance.updateArray('notifications', validated.subscriber);
            }
            instance.updateArray('subscribers', validated.subscriber);
            return yield instance.save();
        });
    }

    static isEditable(instance) {
        // check that this event is running before trying to update
        const now = moment.tz(instance.timezone);
        if (!instance.recurring) {
            // simple check that event didn't end
            return now.isBefore(moment(instance.end_time).tz(instance.timezone));
        } else {
            const rules = RRule.fromString(instance.rrule);
            return rules.before(now.toDate()) === null;
        }
    }
}

module.exports = EventController;
