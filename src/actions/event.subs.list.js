const partial = require('lodash/partial');
const { TYPE_SUB, collectionResponse } = require('../utils/response');

// cached response
const response = partial(collectionResponse, partial.placeholder, TYPE_SUB);

/**
 * @api {http} <prefix>.event.subs.list List all subscriptions for an event
 * @apiVersion 1.0.0
 * @apiName event.subs.list
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.subs.list.json} apiParam
 */
function EventSubsList({ params }) {
  return this
    .services
    .event
    .listSubs(params.filter)
    .then(response);
}

EventSubsList.auth = 'token';
EventSubsList.schema = 'event.subs.list';
EventSubsList.transports = ['http', 'amqp'];

module.exports = EventSubsList;
