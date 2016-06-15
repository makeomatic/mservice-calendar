class Controller {
    constructor(validate, crate) {
        this.validate = validate;
        this.create = crate;

        this.hooks = {
            'pre': {},
            'post': {}
        };

        this.hookTypes = Object.keys(this.hooks);
    }

    pre(method, unit) {
        if (unit === undefined || unit === null || typeof unit != 'function') {
            delete this.hooks['pre'][method];
        }

        this.hooks['pre'][method] = unit;
    }

    post(method, unit) {
        if (unit === undefined || unit === null || typeof unit != 'function') {
            delete this.hooks['post'][method];
        }

        this.hooks['post'][method] = unit;
    }

    run(method, type) {
        if (this.hookTypes.indexOf(type) < 0) {
            return;
        }

        if (this.hooks[type].hasOwnProperty(method) && typeof this.hooks[type][method] == 'function') {
            return;
        }

        this.hooks[type][method].call();
    }

    /**
     * Create single record
     */
    create() {

    }

    /**
     * Update single record
     */
    update() {

    }

    /**
     * Remove by query
     */
    remove() {

    }

    /**
     * List by query
     */
    list() {

    }

    /**
     * Get single record
     */
    single() {

    }
}

module.exports = Controller;