module.exports = class Model {
    get tableName() { return this._tableName; }
    get schema() { return this._schema; }
    
    constructor() {
        this._tableName = '';
        this._schema = {};
    }

    /**
     * Initialize table.
     * @returns {Promise}
     */
    static initialize() {
        throw new Error('No initialization code has been provided.');
    }
};