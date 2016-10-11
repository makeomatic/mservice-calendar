const { coroutine } = require('bluebird');

/**
 * @api {http} <prefix>.event.list List events registered in the system
 * @apiVersion 1.0.0
 * @apiName event.list
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.list.json} apiParam
 * @apiSchema {jsonschema=../../schemas/event.list.response.json} apiSuccess
 */
function EventListAction({ params }) {
  const { event } = this.services;
  const method = event.list.bind(event);
  return coroutine(method)(params);
}

EventListAction.schema = 'event.list';
EventListAction.transports = ['amqp'];

module.exports = EventListAction;
