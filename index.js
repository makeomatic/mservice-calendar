const MService = require('mservice');
const co = require('co');

const EventModel = require('./models/events');
const HostModel = require('./models/hosts');

class CalendarService extends MService {

    constructor(opts = {}) {
        super(Object.assign({}, CalendarService.defaultOpts, opts));
        
        this.crate = require('node-crate');
        this.crate.connect('localhost', 32769);
    }

    /**
     * Creates tables in crate cluster.
     * @returns {*|Promise}
     */
    initialize() {
        return co(function* () {
            return yield [
                EventModel.initialize(this.crate),
                HostModel.initialize(this.crate)
            ];
        }.bind(this));
    }

    router(message, headers, actions) {
        // read more about params in makeomatic/ms-amqp-transport
    }
    
}

CalendarService.defaultOpts = {
    plugins: ['logger'],
    logger: true
};

module.exports = CalendarService;