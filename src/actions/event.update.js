const isAdmin = require('../middlewares/isAdmin');

/**
 * @api {http} <prefix>.event.create Update old event
 * @apiVersion 1.0.0
 * @apiName event.update
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.update.json} apiParam
 */
function EventUpdateAction({ params }) {
  return this.services.event.update(params);
}

EventUpdateAction.auth = 'token';
EventUpdateAction.allowed = isAdmin;
EventUpdateAction.schema = 'event.update';
EventUpdateAction.transports = ['http'];

module.exports = EventUpdateAction;
