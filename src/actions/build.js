const { coroutine } = require('bluebird');

/**
 * @api {http} <prefix>.build Build calendar based on events in the database
 * @apiVersion 1.0.0
 * @apiName build
 * @apiGroup Calendar
 * @apiSchema {jsonschema=../../schemas/calendar.build.json} apiParam
 */
function CalendarBuildAction({ params }) {
  const { calendar } = this.services;
  const method = calendar.build.bind(calendar);
  return coroutine(method)(params);
}

CalendarBuildAction.schema = 'calendar.build';
CalendarBuildAction.transports = ['amqp'];

module.exports = CalendarBuildAction;
