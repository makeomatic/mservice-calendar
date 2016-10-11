const { coroutine } = require('bluebird');

/**
 * @api {http} <prefix>.event.create Create new event
 * @apiVersion 1.0.0
 * @apiName event.create
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.create.json} apiParam
 */
function EventCreateAction({ params }) {
  const { event } = this.services;
  const method = event.create.bind(event);
  return coroutine(method)(params);
}

EventCreateAction.schema = 'event.create';
EventCreateAction.transports = ['amqp'];

module.exports = EventCreateAction;
