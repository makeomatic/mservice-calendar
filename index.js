const MService = require('mservice');
const Promise = require('bluebird');
const Errors = require('common-errors');

const EventModel = require('./models/events');
const HostModel = require('./models/hosts');
const GuestModel = require('./models/guests');

const EventController = require('./controllers/events');

const path = require('path');


class CalendarService extends MService {

    constructor(opts = {}) {
        super(Object.assign({}, CalendarService.defaultOpts, opts));

        // attach data source
        this.db = require('node-crate');
        this.db.connect('localhost', 4200);

        // attach controllers
        this.controllers = {
            'events': new EventController(this.validate, this.db)
        };

        // add coroutine handler for arrays
        Promise.coroutine.addYieldHandler(function arrayHandler(value) {
            if (Array.isArray(value)) return Promise.all(value.map(function (item) {
                return Promise.resolve(item);
            }));
        });
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

    /**
     * Routes messages to appropriate controllers.
     * @param message
     * @param headers
     * @returns {Promise}
     */
    router(message, headers) {
        if (typeof headers['routingKey'] !== typeof 'string') {
            return Promise.reject(new Errors.NotPermitted('Invalid headers'));
        }
        const [_service, _controller, _action] = headers.routingKey.split('.');
        if (_service != 'calendar') {
            return Promise.reject(new Errors.NotPermitted('Invalid routing'));
        }

        if (this.controllers.hasOwnProperty(_controller)) {
            const controller = this.controllers[_controller];
            const action = controller[_action];

            if (typeof action == 'function') {
                return action.call(controller, message);
            } else {
                return Promise.reject(new Errors.Argument('Invalid action'));
            }
        } else {
            return Promise.reject(new Errors.Argument('Invalid controller'));
        }
    }

}

CalendarService.defaultOpts = {
    plugins: ['logger', 'validator'],
    logger: true,
    validator: [path.join(__dirname, 'schemas')]
};

module.exports = CalendarService;