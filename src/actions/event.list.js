const { TYPE_EVENT, collectionResponse } = require('../utils/response');
const partial = require('lodash/partial');

// cached response
const response = partial(collectionResponse, partial.placeholder, TYPE_EVENT);

/**
 * @api {http} <prefix>.event.list List events registered in the system
 * @apiVersion 1.0.0
 * @apiName event.list
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.list.json} apiParam
 */
function EventListAction({ params }) {
  return this
    .services
    .event
    .list(params)
    .then(response);
}

EventListAction.schema = 'event.list';
EventListAction.transports = ['http', 'amqp'];

module.exports = EventListAction;
