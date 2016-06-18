const Controller = require('./controller');

const EventModel = require('../models/events');

const Promise = require('bluebird');
const Errors = require('common-errors');

class EventController extends Controller {
    constructor(...args) {
        super(...args);
    }

    create(data) {
        return this.wrap(data, 'create', function* createUnit(data) {
            if (data.id === undefined) {
                throw new Errors.Argument('New instance ID must be provided');
            }

            const validated = yield this.validate('event', data);
            const instance = new EventModel(this.db, validated);
            return yield instance.save();
        });
    }

    update() {

    }

    remove() {

    }

    list() {

    }

    single() {

    }
}

module.exports = EventController;