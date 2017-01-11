const partial = require('lodash/partial');
const Promise = require('bluebird');
const { TYPE_EVENT, collectionResponse } = require('../utils/response');

// cached response
const response = partial(collectionResponse, partial.placeholder, TYPE_EVENT);

/**
 * @api {http} <prefix>.event.list List events registered in the system
 * @apiVersion 1.0.0
 * @apiName event.list
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.list.json} apiParam
 */
function EventListAction({ params }) {
  return Promise
    .resolve(params.owner && this.services.user.getById(params.owner, ['username']))
    .then((user) => {
      // if not - we didnt supply the id
      if (user) {
        params.owner = user.id;
      }

      return params;
    })
    .bind(this.services.event)
    .then(this.services.event.list)
    .then(response);
}

EventListAction.schema = 'event.list';
EventListAction.transports = ['http', 'amqp'];

module.exports = EventListAction;
