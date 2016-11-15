const { TYPE_EVENT, modelResponse } = require('../utils/response');
const partial = require('lodash/partial');

// cached response
const response = partial(modelResponse, partial.placeholder, TYPE_EVENT);

/**
 * @api {http} <prefix>.event.single Get event by id.
 * @apiVersion 1.0.0
 * @apiName event.single
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.single.json} apiParam
 */
function EventSubscribeAction({ params }) {
  // TODO: filter out subscribers & notifications?
  return this
    .services
    .event
    .get(params.id)
    .then(response);
}

EventSubscribeAction.schema = 'event.single';
EventSubscribeAction.transports = ['http', 'amqp'];

module.exports = EventSubscribeAction;
