module.exports = {
  plugins: [
    'validator', // keep it first
    'logger', // keep it second
    'router',
    'http',
    'amqp',
    'knex',
  ],
};
