require('dotenv').config();

global.SERVICES = {
  amqp: {
    transport: {
      connection: {
        host: 'rabbitmq',
      },
    },
  },
  storage: {
    debug: false,
    client: 'pg',
    connection: {
      host: 'pg',
      user: 'postgres',
      password: '',
    },
  },
};
