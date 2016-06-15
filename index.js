const MService = require('mservice');
const co = require('co');

const EventModel = require('./models/events');
const HostModel = require('./models/hosts');
const GuestModel = require('./models/guests');

const EventController = require('./controllers/events');

const path = require('path');

class CalendarService extends MService {

    constructor(opts = {}) {
        super(Object.assign({}, CalendarService.defaultOpts, opts));

        // attach data source
        this.crate = require('node-crate');
        this.crate.connect('localhost', 32773);

        // attach controllers
        this.controllers = {
            'event': new EventController(this.validate, this.crate)
        }
    }

    /**
     * Creates tables in crate cluster.
     * @returns {*|Promise}
     */
    migrate() {
        return co(function* () {
            return yield [
                EventModel.migrate(this.crate),
                HostModel.migrate(this.crate),
                GuestModel.migrate(this.crate)
            ];
        }.bind(this));
    }

    router(message, headers, actions) {
        // read more about params in makeomatic/ms-amqp-transport
    }
    
}

CalendarService.defaultOpts = {
    plugins: ['logger', 'validator'],
    logger: true,
    validator: [path.join(__dirname, 'schemas')]
};

module.exports = CalendarService;