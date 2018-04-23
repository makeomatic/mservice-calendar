/**
 * @api {http} <prefix>.event.subscribe Subscribe an user to an event
 * @apiVersion 1.0.0
 * @apiName event.subscribe
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.subscribe.json} apiParam
 */
function EventSubscribe({ params, auth }) {
  const { id } = params;
  const { user } = auth.credentials;

  return this
    .services
    .event
    .subscribe(id, user.id)
    // hook
    .bind(this)
    .tap(() => this.hook.call(this, 'event:subscribe:post', params, user));
}

EventSubscribe.auth = 'token';
EventSubscribe.schema = 'event.subscribe';
EventSubscribe.transports = ['http', 'amqp'];

module.exports = EventSubscribe;
