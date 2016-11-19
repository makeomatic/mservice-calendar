const { EVENT_TABLE } = require('../constants');

exports.up = knex => knex.raw(`UPDATE ${EVENT_TABLE} SET owner=lower(owner)`);

exports.down = () => {};
