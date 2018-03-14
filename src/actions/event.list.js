const partial = require('lodash/partial');
const Promise = require('bluebird');
const { TYPE_EVENT, collectionResponse } = require('../utils/response');

// cached response
const response = partial(collectionResponse, partial.placeholder, TYPE_EVENT);

/**
 * Enriches list params
 */
function enrichParams(user) {
  if (user) {
    this.owner = user.id;
  }

  return this;
}

/**
 * @api {http} <prefix>.event.list List events registered in the system
 * @apiVersion 1.0.0
 * @apiName event.list
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.list.json} apiParam
 */
function EventListAction({ params }) {
  const eventService = this.services.event;
  const userService = this.services.user;

  return Promise
    .bind(params, params.owner && userService.getById(params.owner, ['username']))
    .then(enrichParams)
    // resolve event list
    .bind(eventService)
    .then(eventService.list)
    // resolve event list aliases
    .bind(userService)
    .then(userService.getAliasForEvents)
    // hook
    .bind(this)
    .tap(data => this.hook.call(this, 'event:list:post', data, params))
    // response
    .then(response);
}

EventListAction.schema = 'event.list';
EventListAction.transports = ['http', 'amqp'];

module.exports = EventListAction;
