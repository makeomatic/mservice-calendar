const Controller = require('./controller');

const Model = require('../models/model');
const EventModel = require('../models/events');

const Promise = require('bluebird');
const Errors = require('common-errors');
const RRule = require('rrule').RRule;
const moment = require('moment-timezone');

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
            // check that this event is running before trying to update
            const now = moment.tz(instance.timezone);
            if (!instance.recurring) {
                // simple check that event didn't end
                const isValid = now.isBefore(moment(instance.end_time).tz(instance.timezone));
                if (!isValid) {
                    throw new Errors.Validation('Past events can not be edited');
                }
            } else {
                const rules = RRule.fromString(instance.rrule);
                const isValid = rules.before(now).length == 0;
                if (!isValid) {
                    throw new Errors.Validation('Past events can not be edited');
                }
            }
            instance.update(validated);
            return yield instance.save();
        });
    }

    remove(data) {
        return this.wrap(data, 'remove', function* removeUnit(data) {
            const validated = yield this.validate('delete', data);
            
            if (validated.id === undefined && validated.where === undefined) {
                throw new Errors.Argument('Instance ID or filter must be provided');
            }

            if (validated.id) {
                return yield Model.remove(this.db, EventModel, { where: { id: validated.id } })
            } else {
                return yield Model.remove(this.db, EventModel, validated)
            }
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
}

module.exports = EventController;