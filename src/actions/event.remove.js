const { successResponse } = require('../utils/response');
const isAdmin = require('../middlewares/isAdmin');

/**
 * @api {http} <prefix>.event.remove Remove event
 * @apiVersion 1.0.0
 * @apiName event.remove
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.remove.json} apiParam
 */
function EventRegisterAction({ params, auth }) {
  params.owner = auth.credentials.user.id;
  return this
    .services
    .event
    .remove(params)
    .then(successResponse);
}

EventRegisterAction.auth = 'token';
EventRegisterAction.allowed = isAdmin;
EventRegisterAction.schema = 'event.remove';
EventRegisterAction.transports = ['http', 'amqp'];

module.exports = EventRegisterAction;
