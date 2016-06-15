const Promise = require('bluebird');

class Controller {
    constructor(validate, crate) {
        this.validate = validate;
        this.crate = crate;

        this.hooks = {
            'pre': {},
            'post': {}
        };

        this.hookTypes = Object.keys(this.hooks);

        this.dummyHook = function(value) { return value; }
    }

    /**
     * Assign pre hook for specific method. Unit must be function.
     * @param method
     * @param unit
     */
    pre(method, unit) {
        if (unit === undefined || unit === null || typeof unit != 'function') {
            delete this.hooks['pre'][method];
        } else {
            // convert unit to promise
            this.hooks['pre'][method] = unit;
        }
    }

    /**
     * Assign post hook for specific method. Unit must be function.
     * @param method
     * @param unit
     */
    post(method, unit) {
        if (unit === undefined || unit === null || typeof unit != 'function') {
            delete this.hooks['post'][method];
        } else {
            // convert unit to promise
            this.hooks['post'][method] = unit;
        }
    }

    /**
     * Return unit associated with hook, or empty promise.
     * @param method
     * @param type
     */
    run(method, type) {
        if (this.hookTypes.indexOf(type) < 0 || !this.hooks[type].hasOwnProperty(method)) {
            return this.dummyHook;
        }

        if (typeof this.hooks[type][method] != 'function') {
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
        return Promise.resolve(data)
            .then(this.run(method, 'pre'))
            .then(unit.bind(this))
            .then(this.run('create', 'post'));
    }
}

module.exports = Controller;