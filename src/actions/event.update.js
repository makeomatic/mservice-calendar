const isAdmin = require('../middlewares/isAdmin');
const { successResponse } = require('../utils/response');

/**
 * @api {http} <prefix>.event.update Update existing event
 * @apiVersion 1.0.0
 * @apiName event.update
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.update.json} apiParam
 */
function EventUpdateAction({ params, auth }) {
  // attach owner, so that we can only update this
  const owner = auth.credentials.user.id;
  const { event, id } = params;

  // update the event
  return this
    .services
    .event
    .update(id, owner, event)
    .then(successResponse);
}

EventUpdateAction.auth = 'token';
EventUpdateAction.allowed = isAdmin;
EventUpdateAction.schema = 'event.update';
EventUpdateAction.transports = ['http', 'amqp'];

module.exports = EventUpdateAction;
