/**
 * @api {http} <prefix>.event.subscribe Subscribe users to event updates
 * @apiVersion 1.0.0
 * @apiName event.subscribe
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.subscribe.json} apiParam
 */
function EventSubscribeAction({ params }) {
  return this.services.event.subscribe(params);
}

EventSubscribeAction.schema = 'event.subscribe';
EventSubscribeAction.transports = ['http'];

module.exports = EventSubscribeAction;
