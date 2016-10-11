module.exports = {
  amqp: {
    transport: {
      connection: {
        host: '0.0.0.0',
        port: 5672,
      },
    },
    router: {
      enabled: true,
    },
  },
};
