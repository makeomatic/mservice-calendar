const Controller = require('./controller');

const EventModel = require('../models/events');

const Promise = require('bluebird');
const Errors = require('common-errors');
const RRule = require('rrule').RRule;

class EventController extends Controller {
    constructor(...args) {
        super(...args);
    }

    create(data) {
        return this.wrap(data, 'create', function* createUnit(data) {
            if (data.id === undefined) {
                throw new Errors.Argument('New instance ID must be provided');
            }

            if (data.recurring) {
                // if missing rrule, throw
                if (data.rrule === undefined) {
                    throw new Errors.Argument('Recurring rules require rrule attribute');
                }

                // parse rrule to see if it's correct
                try {
                    RRule.parseString(data.rrule);
                } catch (e) {
                    throw new Errors.Argument('Invalid rrule', e);
                }
            }

            if (data.tags === undefined) {
                data.tags = [];
            }

            const validated = yield this.validate('event', data);
            const instance = new EventModel(this.db, validated);
            return yield instance.save();
        });
    }

    update(data) {
        return this.wrap(data, 'update', function* updateUnit(data) {
            if (data.id === undefined) {
                throw new Errors.Argument('Instance ID must be provided');
            }

            const validated = yield this.validate('event.update', data);
            const instance = yield EventModel.single(this.db, validated.id);
            instance.data = validated;
            return yield instance.save();
        });
    }

    remove() {

    }

    list(data) {
        return this.wrap(data, 'list', function* singleUnit(data) {
            const validated = yield this.validate('list', data);
            return yield EventModel.filter(this.db, validated);
        });
    }

    single(data) {
        return this.wrap(data, 'single', function* singleUnit(data) {
            if (data.id === undefined) {
                throw new Errors.Argument('Instance ID must be provided');
            }

            return yield EventModel.single(this.db, data.id);
        });
    }
}

module.exports = EventController;