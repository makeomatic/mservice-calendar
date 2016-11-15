const isAdmin = require('../middlewares/isAdmin');
const { TYPE_EVENT, modelResponse } = require('../utils/response');
const partial = require('lodash/partial');
const defaults = require('lodash/defaults');

// cached response
const response = partial(modelResponse, partial.placeholder, TYPE_EVENT);

/**
 * @api {http} <prefix>.event.create Create new event
 * @apiVersion 1.0.0
 * @apiName event.create
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.create.json} apiParam
 */
function EventCreateAction({ params, auth }) {
  // attach owner
  const event = params.event;
  event.owner = auth.credentials.user.id;

  // set defaults
  defaults(event, {
    tags: [],
    hosts: [],
  });

  // create event
  return this
    .services
    .event
    .create(event)
    .then(response);
}

EventCreateAction.allowed = isAdmin;
EventCreateAction.auth = 'token';
EventCreateAction.schema = 'event.create';
EventCreateAction.transports = ['http', 'amqp'];

module.exports = EventCreateAction;
