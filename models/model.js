const reduce = require('lodash/reduce');
const join = require('lodash/join');
const concat = require('lodash/concat');
const moment = require('moment-timezone');

module.exports = class Model {
    constructor(db) {
        this.db = db;
    }

    createUpdate(update, tableName, id) {
        // TODO: Date timezone!
        const convertType = function(value) {
            switch (typeof value) {
                case 'string':
                    return `'${value}'`;
                case 'number':
                    return String(value);
                case 'object':
                    if (Array.isArray(value)) {
                        return '[' + join(value.map(convertType), ', ') + ']';
                    } else if (value instanceof Date) {
                        return `'${moment(value).format()}'`;
                    } else {
                        return 'null';
                    }
                default:
                    return 'null';
            }
        };

        const setters = reduce(
            update,
            (result, value, key) => concat(result, [`${key}=${convertType(value)}`]),
            []
        );

        return `update ${tableName} set ${join(setters, ', ')} where id=${convertType(id)}`;
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