/**
 * @api {http} <prefix>.event.unsubscribe Subscribe an user to an event
 * @apiVersion 1.0.0
 * @apiName event.unsubscribe
 * @apiGroup Event
 * @apiSchema {jsonschema=../../schemas/event.unsubscribe.json} apiParam
 */
function EventUnsubscribe({ params, auth }) {
  const { id } = params;
  const { user } = auth.credentials;

  return this
    .services
    .event
    .unsubscribe(id, user.id)
    .tap(() => this.hook.call(this, 'event:unsubscribe:post', params, user));
}

EventUnsubscribe.auth = 'token';
EventUnsubscribe.schema = 'event.unsubscribe';
EventUnsubscribe.transports = ['http', 'amqp'];

module.exports = EventUnsubscribe;
