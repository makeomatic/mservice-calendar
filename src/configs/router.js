const { ActionTransport, routerExtension } = require('mservice');
const auth = require('../auth/token');
const path = require('path');

module.exports = {
  router: {
    routes: {
      directory: path.resolve(__dirname, '../actions'),
      prefix: 'calendar',
      transports: [
        ActionTransport.http,
        ActionTransport.amqp,
      ],
    },
    extensions: {
      enabled: ['postValidate', 'postRequest', 'preRequest', 'preResponse'],
      register: [
        routerExtension('audit/log'),
      ],
    },
    auth: {
      strategies: {
        token: auth,
      },
    },
  },
};
