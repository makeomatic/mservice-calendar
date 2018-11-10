exports.name = 'ms-calendar';

exports.plugins = [
  'validator', // keep it first
  'logger', // keep it second
  'router',
  'http',
  'amqp',
  'knex',
];

exports.eventVersion = 1;
