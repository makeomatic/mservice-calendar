const Promise = require('bluebird');
const is = require('is');

const hasOwnProperty = Object.prototype.hasOwnProperty;

function isGenerator(f) {
  // eslint-disable-next-line
  return Object.getPrototypeOf(f) === Object.getPrototypeOf(function* () {});
}

class Controller {
  constructor(validate, crate) {
    this.validate = validate;
    this.db = crate;

    this.hooks = {
      pre: {},
      post: {},
    };

    this.hookTypes = Object.keys(this.hooks);
    this.dummyHook = value => value;
  }

    /**
     * Assign pre hook for specific method. Unit must be function.
     * @param method
     * @param unit
     */
  pre(method, unit) {
    if (!is.fn(unit)) {
      delete this.hooks.pre[method];
    } else {
      // convert unit to promise
      this.hooks.pre[method] = unit;
    }
  }

    /**
     * Assign post hook for specific method. Unit must be function.
     * @param method
     * @param unit
     */
  post(method, unit) {
    if (!is.fn(unit)) {
      delete this.hooks.post[method];
    } else {
      // convert unit to promise
      this.hooks.post[method] = unit;
    }
  }

    /**
     * Return unit associated with hook, or empty promise.
     * @param method
     * @param type
     */
  run(method, type) {
    if (this.hookTypes.indexOf(type) < 0 || !hasOwnProperty.call(this.hooks[type], method)) {
      return this.dummyHook;
    }

    if (!is.fn(this.hooks[type][method])) {
      return this.dummyHook;
    }

    return this.hooks[type][method];
  }

    /**
     * Wrap controller method with pre and post hooks.
     * Automatically binds unit to this.
     * @param data
     * @param method
     * @param unit
     * @returns {Promise}
     */
  wrap(data, method, unit) {
    const normalizedUnit = isGenerator(unit) ? Promise.coroutine(unit) : unit;

    return Promise
      .bind(this, data)
      .then(this.run(method, 'pre'))
      .then(normalizedUnit)
      .then(this.run('create', 'post'));
  }
}

module.exports = Controller;
