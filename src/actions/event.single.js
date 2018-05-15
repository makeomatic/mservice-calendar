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
function EventGet({ params }) {
  return this
    .services
    .event
    .get(params.id)
    .then(response);
}

EventGet.auth = 'token';
EventGet.schema = 'event.single';
EventGet.transports = ['http', 'amqp'];

module.exports = EventGet;
