const isAdmin = require('../middlewares/isAdmin');
const { EVENT_TAGS_TABLE } = require('../constants');
const { successResponse } = require('../utils/response');

/**
 * @api {http} <prefix>.event.tags.create Remove tag
 * @apiVersion 1.0.0
 * @apiName event.tags.delete
 * @apiGroup Tags
 * @apiSchema {jsonschema=../../schemas/event.tags.delete.json} apiParam
 */
function EventTagsDelete({ params }) {
  return this.knex(EVENT_TAGS_TABLE)
    .where({ id: params.tag })
    .del()
    .then(successResponse);
}

EventTagsDelete.allowed = isAdmin;
EventTagsDelete.auth = 'token';
EventTagsDelete.schema = 'event.tags.delete';
EventTagsDelete.transports = ['http', 'amqp'];

module.exports = EventTagsDelete;
