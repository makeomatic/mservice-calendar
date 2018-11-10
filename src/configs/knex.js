const path = require('path');

exports.knex = {
  client: 'pg',
  debug: false,
  connection: 'postgres://postgres@postgres:5432/postgres',
  searchPath: ['public', 'calendar'],
  migrations: {
    tableName: 'migrations',
    directory: path.resolve(__dirname, '../migrations'),
  },
};
