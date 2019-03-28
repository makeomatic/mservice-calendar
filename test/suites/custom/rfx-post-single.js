const assert = require('assert');
const request = require('../../helpers/request');
const { login } = require('../../helpers/users');

describe('rfx-post-single hook test suite', function suite() {
  const Calendar = require('../../../src');
  const { EVENT_TABLE } = require('../../../src/constants');
  const calendar = new Calendar({
    hooks: {
      // eslint-disable-next-line
      'event:single:post': require('/src/src/custom/rfx-post-single.js'),
    },
  });
  const uri = {
    create: 'http://0.0.0.0:3000/api/calendar/event/create',
    single: 'http://0.0.0.0:3000/api/calendar/event/single',
  };

  before('start service', async () => {
    await calendar.connect();
    await calendar.knex.raw(`DELETE FROM ${EVENT_TABLE}`);
  });
  after('stop service', () => calendar.close());

  before('login', () => login(calendar.amqp, 'admin@foo.com', 'adminpassword00000').tap(
    ({ jwt }) => (this.token = jwt)
  ));

  before('create event', () => request(uri.create, {
    token: this.token,
    event: {
      title: 'Test event',
      description: 'Event description',
      tags: ['music', 'jazz'],
      hosts: ['dj felipe'],
      rrule:
          'DTSTART=20180709T120000Z;UNTIL=20501201T140000Z;WKST=SU;FREQ=WEEKLY;BYDAY=MO',
      duration: 120,
      tz: 'Europe/London',
    },
  }).then((response) => {
    this.eventId = response.body.data.id;
    return null;
  }));

  before('create byhour event', () => request(uri.create, {
    token: this.token,
    event: {
      title: 'Test byhour event',
      description: 'Byhour event description',
      tags: ['music', 'jazz'],
      hosts: ['dj felipe'],
      rrule:
        'DTSTART;TZID=US/Eastern:20190201T000000\nRRULE:WKST=SU;BYHOUR=12;BYMINUTE=0;BYSECOND=0;FREQ=WEEKLY;BYDAY=FR;UNTIL=20500525T180000',
      duration: 120,
      tz: 'US/Eastern',
    },
  }).then((response) => {
    this.byHourEventId = response.body.data.id;
    return null;
  }));

  before('create byhour event without until date', () => request(uri.create, {
    token: this.token,
    event: {
      title: 'Test byhour event',
      description: 'Byhour event description',
      tags: ['music', 'jazz'],
      hosts: ['dj felipe'],
      rrule:
        'DTSTART;TZID=US/Eastern:20600101T000000\nRRULE:WKST=SU;BYHOUR=12;BYMINUTE=0;BYSECOND=0;COUNT=1;FREQ=DAILY',
      duration: 120,
      tz: 'US/Eastern',
    },
  }).then((response) => {
    this.byHourNoUntilEventId = response.body.data.id;
    return null;
  }));

  describe('event/single', () => {
    it('return aditional attributes', () => request(uri.single, {
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

    it('returns correct spans for legacy timezone events', () => request(uri.single, {
      id: this.byHourEventId,
      token: this.token,
    }).then((response) => {
      const { body, statusCode } = response;

      assert.equal(statusCode, 200, JSON.stringify(body));
      assert.ok(body.data);
      assert.ok(body.data.id);

      // Additional attributes
      assert.ok(body.data.attributes.start_time);
      assert.strictEqual(body.data.attributes.start_time.length, 3);
      body.data.attributes.start_time.forEach(startDate => assert.ok(startDate));

      // does not include internal non-enum properties
      assert.ok(!body.data.attributes.parsedRRule);

      return null;
    }));

    it('correctly return spans for no-until events', () => request(uri.single, {
      id: this.byHourNoUntilEventId,
      token: this.token,
    }).then((response) => {
      const { body, statusCode } = response;

      assert.equal(statusCode, 200, JSON.stringify(body));
      assert.ok(body.data);
      assert.ok(body.data.id);
      assert.ok(body.data.attributes.start_time);
      assert.strictEqual(body.data.attributes.start_time.length, 1);

      return null;
    }));
  });
});
