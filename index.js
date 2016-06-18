const MService = require('mservice');
const Promise = require('bluebird');

const EventModel = require('./models/events');
const HostModel = require('./models/hosts');
const GuestModel = require('./models/guests');

const EventController = require('./controllers/events');

const path = require('path');

Promise.coroutine.addYieldHandler(function (value) {
    if (Array.isArray(value)) return Promise.all(value.map(function (item) {
        return Promise.resolve(item).catch(function(error) {
            console.error(error);
        });
    }));
});

class CalendarService extends MService {

    constructor(opts = {}) {
        super(Object.assign({}, CalendarService.defaultOpts, opts));

        // attach data source
        this.db = require('node-crate');
        this.db.connect('localhost', 32769);

        // attach controllers
        this.controllers = {
            'event': new EventController(this.validate, this.db)
        }
    }

    /**
     * Creates tables in crate cluster.
     * @returns {Promise}
     */
    migrate() {
        const worker = Promise.coroutine(function*() {
            return yield [
                EventModel.migrate(this.db),
                HostModel.migrate(this.db),
                GuestModel.migrate(this.db)
            ];
        }.bind(this));

        return worker();
    }

    test() {
        this.controllers['event'].create({'id': 6, 'title': 'Test event', 'description': 'Testing'}).then(function (data) {
            console.log('finish', data);
        }).catch(e => { console.error(e); });
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