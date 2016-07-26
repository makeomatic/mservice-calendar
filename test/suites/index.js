/* eslint-disable prefer-arrow-callback */
const assert = require('assert');

describe('Functionality suite', function FunctionalitySuite() {
  const Calendar = require('../../lib');

  const host = process.env.CRATE_HOST || '127.0.0.1';
  const connectionString = `http://${host}:4200`;
  const service = new Calendar({ crate: { namespace: 'test_calendar', connectionString } });

  it('Should fail on invalid route', () => service
    .router({}, { routingKey: 'files.test.test' })
    .reflect()
    .then(result => {
      assert(result.isRejected());
      return null;
    })
  );

  it('Should fail on invalid routing schema', () => service
    .router({}, { invalid: true })
    .reflect()
    .then(result => {
      assert(result.isRejected());
      return null;
    })
  );

  it('Should fail on invalid controller', () => service
    .router({}, { routingKey: 'calendar.invalid.test' })
    .reflect()
    .then(result => {
      assert(result.isRejected());
      return null;
    })
  );

  it('Should fail on invalid action', () => service
    .router({}, { routingKey: 'calendar.events.invalid' })
    .reflect()
    .then(result => {
      assert(result.isRejected());
      return null;
    })
  );
});
