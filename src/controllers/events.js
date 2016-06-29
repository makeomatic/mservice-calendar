const Controller = require('./controller');

const Model = require('../models/model');
const EventModel = require('../models/events');

const Promise = require('bluebird');
const Errors = require('common-errors');
const RRule = require('rrule').RRule;
const moment = require('moment-timezone');

const map = require('lodash/map');
const concat = require('lodash/concat');

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
            const events = yield this.list({where: {}}); // select all events

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
