/**
 * @api {http} <prefix>.event.single Get event by id.
 * @apiVersion 1.0.0
 * @apiName event.single
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.single.json} apiParam
 */
function EventSubscribeAction({ params }) {
  return this.services.event.single(params);
}

EventSubscribeAction.schema = 'event.single';
EventSubscribeAction.transports = ['http'];

module.exports = EventSubscribeAction;
