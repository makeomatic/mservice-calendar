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
        const worker = Promise.coroutine(function*() {
            return yield [
                EventModel.migrate(this.crate),
                HostModel.migrate(this.crate),
                GuestModel.migrate(this.crate)
            ];
        }.bind(this));

        worker();
    }

    test() {
        this.controllers['event'].pre('create', function (data) {
            console.log('pre', data);
            data['hey'] = 'hoi';
            return data;
        });
        this.controllers['event'].post('create', function (data) {
            console.log('post', data);
            data['hoi'] = 'hey';
            return data;
        });
        this.controllers['event'].create({'test': 1}).then(function (data) {
            console.log('finish', data);
        });
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