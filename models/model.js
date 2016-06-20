const reduce = require('lodash/reduce');
const join = require('lodash/join');
const concat = require('lodash/concat');
const moment = require('moment-timezone');

module.exports = class Model {
    constructor(db) {
        this.db = db;
    }

    createUpdate(update, tableName, id) {
        const setters = reduce(
            update,
            (result, value, key) => concat(result, `${key}=${Model.convertType(value)}`),
            []
        );

        return `update ${tableName} set ${join(setters, ', ')} where id=${Model.convertType(id)}`;
    }

    // TODO: Date timezone!
    static convertType(value) {
        switch (typeof value) {
            case 'string':
                return `'${value}'`;
            case 'number':
            case 'boolean':
                return value;
            case 'object':
                if (Array.isArray(value)) {
                    return '[' + join(value.map(Model.convertType), ', ') + ']';
                } else if (value instanceof Date) {
                    return `'${moment(value).format()}'`;
                } else {
                    return 'null';
                }
            default:
                return 'null';
        }
    };
    
    static createFilter(filter, tableName) {
        const where = reduce(
            filter.where,
            (result, value, key) => {
                let operator = '=';
                if (Array.isArray(value)) {
                    operator = value[0];
                    value = value[1];
                }
                const condition = `${key} ${operator} ?`;
                const escapedValue = Model.convertType(value);

                return {
                    command: concat(result.command, condition),
                    arguments: concat(result.arguments, escapedValue)
                };
            },
            {command: [], arguments: []}
        );

        let base = `select * from ${tableName}`;
        if (where.command.length > 0) {
            base += ` where ${join(where.command, ',')}`;
        }

        return [base, where.arguments];
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