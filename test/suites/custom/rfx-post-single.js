const assert = require('assert');
const extend = require('lodash/extend');
const request = require('../../helpers/request');
const { login } = require('../../helpers/users');

describe('rfx-post-single hook test suite', function suite() {
  const Calendar = require('../../../src');
  const calendar = new Calendar(
    extend({}, global.SERVICES, {
      hooks: {
        'event:single:post': require('../../../src/custom/rfx-post-single.js'),
      },
    })
  );
  const uri = {
    create: 'http://0.0.0.0:3000/api/calendar/event/create',
    single: 'http://0.0.0.0:3000/api/calendar/event/single',
  };

  before('start service', () => calendar.connect());
  after('stop service', () => calendar.close());

  before('login', () =>
    login(calendar.amqp, 'admin@foo.com', 'adminpassword00000').tap(
      ({ jwt }) => (this.token = jwt)
    )
  );

  before('create event', () =>
    request(uri.create, {
      token: this.token,
      event: {
        title: 'Test event',
        description: 'Event description',
        tags: ['music', 'jazz'],
        hosts: ['dj felipe'],
        rrule:
          'DTSTART=20180709T120000Z;UNTIL=20181201T140000Z;WKST=SU;FREQ=WEEKLY;BYDAY=MO',
        duration: 120,
      },
    }).then((response) => {
      this.eventId = response.body.data.id;
      return null;
    })
  );

  describe('event/single', () => {
    it('return aditional attributes', () =>
      request(uri.single, {
        id: this.eventId,
        token: this.token,
      }).then((response) => {
        const { body, statusCode } = response;

        assert.equal(statusCode, 200, JSON.stringify(body));
        assert.ok(body.data);
        assert.ok(body.data.id);

        // Additional attributes
        assert.ok(body.data.attributes.start_time);

        return null;
      }));
  });
});
