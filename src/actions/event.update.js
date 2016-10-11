const { coroutine } = require('bluebird');

/**
 * @api {http} <prefix>.event.create Update old event
 * @apiVersion 1.0.0
 * @apiName event.update
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.update.json} apiParam
 */
function EventUpdateAction({ params }) {
  const { event } = this.services;
  const method = event.update.bind(event);
  return coroutine(method)(params);
}

EventUpdateAction.schema = 'event.update';
EventUpdateAction.transports = ['amqp'];

module.exports = EventUpdateAction;
