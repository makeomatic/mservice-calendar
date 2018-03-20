const partial = require('lodash/partial');
const Promise = require('bluebird');
const { TYPE_TAG, collectionResponse } = require('../utils/response');

// cached response
const response = partial(collectionResponse, partial.placeholder, TYPE_TAG);

/**
 * @api {http} <prefix>.event.tags.list List tags
 * @apiVersion 1.0.0
 * @apiName event.tags.list
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.tags.list.json} apiParam
 * @apiSchema {jsonschema=../../schemas/event.tags.list.response.json} apiSuccess
 */
function EventTagsList({ method, params, query }) {
  const input = method === 'get' ? query : params;
  const eventService = this.services.event;

  return Promise
    .resolve(input)
    // resolve event list
    .bind(eventService)
    .then(eventService.listTags)
    // response
    .then(response);
}

EventTagsList.schema = 'event.tags.list';
EventTagsList.transports = ['http'];

module.exports = EventTagsList;
