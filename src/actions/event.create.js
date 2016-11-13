const isAdmin = require('../middlewares/isAdmin');

/**
 * @api {http} <prefix>.event.create Create new event
 * @apiVersion 1.0.0
 * @apiName event.create
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.create.json} apiParam
 */
function EventCreateAction({ params }) {
  return this.services.event.create(params);
}

EventCreateAction.allowed = isAdmin;
EventCreateAction.auth = 'token';
EventCreateAction.schema = 'event.create';
EventCreateAction.transports = ['http'];

module.exports = EventCreateAction;
