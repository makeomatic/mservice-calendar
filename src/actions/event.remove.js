const { coroutine } = require('bluebird');

/**
 * @api {http} <prefix>.event.remove Remove event
 * @apiVersion 1.0.0
 * @apiName event.remove
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.remove.json} apiParam
 */
function EventRegisterAction({ params }) {
  const { event } = this.services;
  const method = event.remove.bind(event);
  return coroutine(method)(params);
}

EventRegisterAction.schema = 'event.remove';
EventRegisterAction.transports = ['amqp'];

module.exports = EventRegisterAction;
