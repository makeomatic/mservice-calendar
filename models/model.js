module.exports = class Model {
    constructor(crate) {
        this.crate = crate;
    }

    /**
     * Initialize table.
     * @returns {Promise}
     */
    static initialize() {
        throw new Error('No initialization code has been provided.');
    }
};