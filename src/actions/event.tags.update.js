const isAdmin = require('../middlewares/isAdmin');
const { EVENT_TAGS_TABLE } = require('../constants');
const { TYPE_TAG, modelResponse } = require('../utils/response');
const partial = require('lodash/partial');

// cached response
const response = partial(modelResponse, partial.placeholder, TYPE_TAG);

/**
 * @api {http} <prefix>.event.tags.update Update existing tag
 * @apiVersion 1.0.0
 * @apiName event.tags.update
 * @apiGroup Tags
 * @apiSchema {jsonschema=../../schemas/event.tags.update.json} apiParam
 */
function EventTagsUpdate({ params }) {
  return this.knex(EVENT_TAGS_TABLE)
    .where({ id: params.tag.id })
    .update(params.tag, '*')
    .then(arr => response(arr[0]));
}

EventTagsUpdate.allowed = isAdmin;
EventTagsUpdate.auth = 'token';
EventTagsUpdate.schema = 'event.tags.update';
EventTagsUpdate.transports = ['http', 'amqp'];

module.exports = EventTagsUpdate;
