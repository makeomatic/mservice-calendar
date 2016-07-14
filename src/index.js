const MService = require('mservice');
const Promise = require('bluebird');
const Errors = require('common-errors');

const Model = require('./models/model');
const EventModel = require('./models/events');

const EventController = require('./controllers/events');

const path = require('path');
const merge = require('lodash/merge');

const inspect = require('util').inspect;

class CalendarService extends MService {

    /**
     * Construct service.
     * @param opts {Object}
     * @param opts.namespace {string} Namespace for tables. Default is 'calendar'.
     */
    constructor(opts = {}) {
        const conf = merge({}, CalendarService.defaultOpts, opts);

        super(conf);
        this.router = this.router.bind(this);

        // attach data source
        this.db = require('node-crate');
        this.db.connect(this.config.crate.connectionString || 'http://localhost:4200');
        this.db._namespace = this.config.crate.namespace || 'calendar';

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
                Model.migrate(this.db, EventModel)
            ];
        }.bind(this));

        return worker();
    }

    /**
     * Drops tables in crate cluster. Careful here!
     * @returns {Promise}
     */
    cleanup() {
        const worker = Promise.coroutine(function*() {
            return yield [
                Model.cleanup(this.db, EventModel)
            ];
        }.bind(this));

        return worker();
    }

    /**
     * Routes messages to appropriate controllers.
     * @param message
     * @param headers
     * @param actions
     * @param next
     * @returns {Promise}
     */
    router(message, headers, actions, next) {
        const { _config: { amqp: { onCompete }, debug }, log, controllers } = this;
        const time = process.hrtime();

        let promise = Promise.bind(this);

        if (typeof headers['routingKey'] !== typeof 'string') {
            promise = promise.throw(new Errors.NotPermitted('Invalid headers'));
        } else {
            const [_service, _controller, _action] = headers.routingKey.split('.');

            if (_service != 'calendar') {
                promise = promise.throw(new Errors.NotPermitted('Invalid routing'));
            } else {
                if (controllers.hasOwnProperty(_controller)) {
                    const controller = controllers[_controller];
                    const action = controller[_action];

                    if (typeof action == 'function') {
                        promise = action.call(controller, message);
                    } else {
                        promise = promise.throw(new Errors.Argument('Invalid action'));
                    }
                } else {
                    promise = promise.throw(new Errors.Argument('Invalid controller'));
                }
            }
        }

        // this is a hook to handle QoS or any other events
        if (typeof onComplete == 'function') {
            promise = promise
                .reflect()
                .then(fate => {
                    const err = fate.isRejected() ? fate.reason() : null;
                    const data = fate.isFulfilled() ? fate.value() : null;
                    return [err, data, actionName, actions];
                })
                .spread(onComplete);
        }

        // if we have an error
        promise = promise
            .reflect()
            .then(function auditLog(fate) {
                const execTime = process.hrtime(time);
                const meta = {
                    message,
                    headers,
                    latency: (execTime[0] * 1000) + (+(execTime[1] / 1000000).toFixed(3)),
                };

                if (fate.isRejected()) {
                    const reason = fate.reason();
                    const err = typeof reason.toJSON == 'function' ? reason.toJSON() : inspect(reason);
                    log.error(meta, 'Error performing operation', err);
                    throw reason;
                }

                const response = fate.value();
                log.info(meta, 'completed operation', debug ? response : '');
                return response;
            });

        if (typeof next == 'function') {
            return promise.asCallback(next);
        }

        return promise;
    }

}

CalendarService.defaultOpts = {
    plugins: ['logger', 'validator', 'amqp'],
    logger: process.env === 'production',
    validator: [path.join(__dirname, '../schemas')],
    crate: {},
    amqp: {
        queue: 'ms-calendar',
        initRoutes: false,
        initRouter: false,
        listen: [
            'calendar.events.create',
            'calendar.events.update',
            'calendar.events.remove',
            'calendar.events.list',
            'calendar.events.single',
            'calendar.events.subscribe',
            'calendar.events.calendar'
        ]
    },
};

module.exports = CalendarService;
