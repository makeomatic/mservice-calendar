/**
 * @api {http} <prefix>.event.list List events registered in the system
 * @apiVersion 1.0.0
 * @apiName event.list
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.list.json} apiParam
 */
function EventListAction({ params }) {
  return this.services.event.list(params);
}

EventListAction.schema = 'event.list';
EventListAction.transports = ['http'];

module.exports = EventListAction;
