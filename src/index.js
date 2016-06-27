const MService = require('mservice');
const Promise = require('bluebird');
const Errors = require('common-errors');
const Crate = require('node-crate');
const path = require('path');

const Model = require('./models/model');
const EventModel = require('./models/events');
const HostModel = require('./models/hosts');
const GuestModel = require('./models/guests');

const EventController = require('./controllers/events');

class CalendarService extends MService {

    /**
     * Construct service.
     * @param opts {Object}
     * @param opts.namespace {string} Namespace for tables. Default is 'calendar'.
     */
  constructor(opts = {}) {
    super(Object.assign({ crate: {} }, CalendarService.defaultOpts, opts));

        // attach data source
    this.db = Crate;
    this.db.connect(this.config.crate.connectionString || 'http://localhost:4200');
    this.db._namespace = this.config.crate.namespace || 'calendar';

        // attach controllers
    this.controllers = {
      events: new EventController(this.validate, this.db),
    };

        // add coroutine handler for arrays
    Promise.coroutine.addYieldHandler(function arrayHandler(value) {
      if (Array.isArray(value)) {
        return Promise.all(value.map(item => Promise.resolve(item)));
      }

      return null;
    });
  }

    /**
     * Creates tables in crate cluster.
     * @returns {Promise}
     */
  migrate() {
    const worker = Promise.coroutine(function* gen() {
      return yield [
        Model.migrate(this.db, EventModel),
        Model.migrate(this.db, HostModel),
        Model.migrate(this.db, GuestModel),
      ];
    }.bind(this));

    return worker();
  }

    /**
     * Drops tables in crate cluster. Careful here!
     * @returns {Promise}
     */
  cleanup() {
    const worker = Promise.coroutine(function* gen() {
      return yield [
        Model.cleanup(this.db, EventModel),
        Model.cleanup(this.db, HostModel),
        Model.cleanup(this.db, GuestModel),
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
    if (typeof headers.routingKey !== 'string') {
      return Promise.reject(new Errors.NotPermitted('Invalid headers'));
    }
    const [_service, _controller, _action] = headers.routingKey.split('.');
    if (_service !== 'calendar') {
      return Promise.reject(new Errors.NotPermitted('Invalid routing'));
    }

    if (this.controllers.hasOwnProperty(_controller)) {
      const controller = this.controllers[_controller];
      const action = controller[_action];

      if (typeof action === 'function') {
        return action.call(controller, message);
      }

      return Promise.reject(new Errors.Argument('Invalid action'));
    }

    return Promise.reject(new Errors.Argument('Invalid controller'));
  }

}

CalendarService.defaultOpts = {
  plugins: ['logger', 'validator', 'amqp'],
  logger: true,
  validator: [path.resolve(__dirname, '../schemas')],
  amqp: {
    queue: 'ms-calendar',
    // prefix routes with users.
    prefix: 'calendar',
    // automatically init routes
    initRoutes: false,
    // automatically init router
    initRouter: false,
  },
};

module.exports = CalendarService;
