module.exports = class Model {
    constructor(db) {
        this.db = db;
    }

    /**
     * Initialize table.
     * @returns {Promise}
     */
    static initialize() {
        throw new Error('No initialization code has been provided.');
    }

    static parseResult(result) {
        if (result.json) {
            return result.json;
        }
    }
};