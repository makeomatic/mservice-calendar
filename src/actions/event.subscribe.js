const { coroutine } = require('bluebird');

/**
 * @api {http} <prefix>.event.subscribe Subscribe users to event updates
 * @apiVersion 1.0.0
 * @apiName event.subscribe
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.subscribe.json} apiParam
 */
function EventSubscribeAction({ params }) {
  const { event } = this.services;
  const method = event.subscribe.bind(event);
  return coroutine(method)(params);
}

EventSubscribeAction.schema = 'event.subscribe';
EventSubscribeAction.transports = ['amqp'];

module.exports = EventSubscribeAction;
