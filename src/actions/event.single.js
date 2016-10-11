const { coroutine } = require('bluebird');

/**
 * @api {http} <prefix>.event.single Get event by id.
 * @apiVersion 1.0.0
 * @apiName event.single
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.single.json} apiParam
 */
function EventSubscribeAction({ params }) {
  const { event } = this.services;
  const method = event.single.bind(event);
  return coroutine(method)(params);
}

EventSubscribeAction.schema = 'event.single';
EventSubscribeAction.transports = ['amqp'];

module.exports = EventSubscribeAction;
