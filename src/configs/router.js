const { ActionTransport, routerExtension } = require('@microfleet/core');
const path = require('path');
const auth = require('../auth/token');

exports.router = {
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
};
