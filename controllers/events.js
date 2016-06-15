const Controller = require('./controller');

const EventModel = require('../models/events');

const Promise = require('bluebird');

class EventController extends Controller {
    constructor(...args) {
        super(...args);
    }

    create(data) {
        return this.wrap(data, 'create', function(data) {
            return data;
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