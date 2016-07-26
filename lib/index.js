const MService = require('mservice');
const path = require('path');
const merge = require('lodash/merge');
const Promise = require('bluebird');
const Errors = require('common-errors');
const Crate = require('node-crate');
const is = require('is');
const assert = require('assert');
const { inspect } = require('util');

const Model = require('./models/model');
const EventModel = require('./models/events');
const EventController = require('./controllers/events');

const hasOwnProperty = Object.prototype.hasOwnProperty;

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
    this.db = Crate;
    this.db.connect(this.config.crate.connectionString || 'http://localhost:4200');
    this.db._namespace = this.config.crate.namespace || 'calendar';

    // attach controllers
    this.controllers = {
      events: new EventController(this.validate, this.db),
    };

    // add coroutine handler for arrays
    Promise.coroutine.addYieldHandler(value => {
      if (is.array(value)) {
        return Promise.map(value, item => Promise.resolve(item));
      }

      return undefined;
    });
  }

    /**
     * Creates tables in crate cluster.
     * @returns {Promise}
     */
  migrate() {
    const service = this;
    const worker = Promise.coroutine(function* migrate() {
      return yield [
        Model.migrate(service.db, EventModel),
      ];
    });

    return worker();
  }

    /**
     * Drops tables in crate cluster. Careful here!
     * @returns {Promise}
     */
  cleanup() {
    const service = this;
    const worker = Promise.coroutine(function* cleanup() {
      return yield [
        Model.cleanup(service.db, EventModel),
      ];
    });

    return worker();
  }

  auditLog(time, message, headers) {
    const log = this.log;
    const debug = this.config.debug;

    return function auditLog(fate) {
      const execTime = process.hrtime(time);
      const meta = {
        message,
        headers,
        latency: (execTime[0] * 1000) + (+(execTime[1] / 1000000).toFixed(3)),
      };

      if (fate.isRejected()) {
        const reason = fate.reason();
        const err = is.fn(reason.toJSON) ? reason.toJSON() : inspect(reason);
        log.error(meta, 'Error performing operation', err);
        throw reason;
      }

      const response = fate.value();
      log.info(meta, 'completed operation', debug ? response : '');
      return response;
    };
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
    const { _config: { amqp: { onComplete } }, controllers } = this;
    const time = process.hrtime();

    // short circuit incorrect headers
    if (!is.string(headers.routingKey)) {
      const promise = Promise
        .reject(new Errors.NotPermitted('`headers.routingKey` must be specified'))
        .reflect()
        .then(this.auditLog(time, message, headers));

      return is.fn(next) ? promise.asCallback(next) : promise;
    }

    const promise = Promise
      .bind(this)
      .then(() => {
        const [serviceName, controllerName, actionName] = headers.routingKey.split('.');
        assert.equal(serviceName, 'calendar', 'routing prefix must be equal to `calendar`');
        assert.ok(
          hasOwnProperty.call(controllers, controllerName),
          `controller ${controllers} is not supported`
        );

        const controller = controllers[controllerName];
        const action = controller[actionName];

        assert.ok(is.fn(action), `${actionName} is not supported`);
        const output = action.call(controller, message);

        if (is.fn(onComplete)) {
          return output
            .reflect()
            .then(fate => {
              const err = fate.isRejected() ? fate.reason() : null;
              const data = fate.isFulfilled() ? fate.value() : null;
              return [err, data, actionName, actions];
            })
            .spread(onComplete);
        }

        return output;
      })
      .reflect()
      .then(this.auditLog(time, message, headers));

    if (is.fn(next)) {
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
      'calendar.events.calendar',
    ],
  },
};

module.exports = CalendarService;
