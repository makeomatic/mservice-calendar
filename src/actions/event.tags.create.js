const isAdmin = require('../middlewares/isAdmin');
const { EVENT_TAGS_TABLE } = require('../constants');
const { TYPE_TAG, modelResponse } = require('../utils/response');
const partial = require('lodash/partial');

// cached response
const response = partial(modelResponse, partial.placeholder, TYPE_TAG);

/**
 * @api {http} <prefix>.event.tags.create Create new tag
 * @apiVersion 1.0.0
 * @apiName event.tags.create
 * @apiGroup Tags
 * @apiSchema {jsonschema=../../schemas/event.tags.create.json} apiParam
 */
function EventTagsCreate({ params }) {
  return this.knex(EVENT_TAGS_TABLE)
    .insert(params.tag)
    .returning('*')
    .then(arr => response(arr[0]));
}

EventTagsCreate.allowed = isAdmin;
EventTagsCreate.auth = 'token';
EventTagsCreate.schema = 'event.tags.create';
EventTagsCreate.transports = ['http', 'amqp'];

module.exports = EventTagsCreate;
