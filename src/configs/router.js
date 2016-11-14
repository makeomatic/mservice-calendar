const { ActionTransport, routerExtension } = require('mservice');
const path = require('path');

const auditLog = routerExtension('audit/log');
const { amqp, http } = ActionTransport;

module.exports = {
  router: {
    routes: {
      directory: path.resolve(__dirname, '../actions'),
      prefix: 'calendar',
      transports: [amqp, http],
    },
    extensions: {
      enabled: ['postRequest', 'preRequest', 'preResponse'],
      register: [auditLog],
    },
  },
};
