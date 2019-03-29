const assert = require('assert');
const moment = require('moment-timezone');

describe('rfx-filter-group-list hook test suite', function suite() {
  let Calendar;
  let calendar;

  const request = require('../../helpers/request');
  const { login } = require('../../helpers/users');
  const now = () => moment(new Date(2018, 10, 16));
  const { EVENT_TABLE } = require('../../../src/constants');
  const uri = {
    create: 'http://0.0.0.0:3000/api/calendar/event/create',
    list: 'http://0.0.0.0:3000/api/calendar/event/list',
  };

  before(async () => {
    Calendar = require('../../../src');
    calendar = new Calendar({
      hooks: {
        // eslint-disable-next-line
        'event:list:post': require('/src/src/custom/rfx-filter-group-list.js'),
      },
    });

    await calendar.connect();
    await calendar.knex.raw(`DELETE FROM ${EVENT_TABLE}`);
  });

  after('stop service', () => calendar.close());

  before('login first admin', () => (
    login(calendar.amqp, 'admin@foo.com', 'adminpassword00000')
      .tap(({ jwt }) => (this.firstAdminToken = jwt))
  ));

  before('login second admin', () => (
    login(calendar.amqp, 'second.admin@foo.com', 'secondadminpassword')
      .tap(({ jwt }) => {
        this.secondAdminToken = jwt;
      })
  ));

  before('login group admin', () => (
    login(calendar.amqp, 'group.admin@foo.com', 'groupadminpassword')
      .tap(({ jwt }) => {
        this.groupAdminToken = jwt;
      })
  ));

  before('create event 1', () => request(uri.create, {
    token: this.firstAdminToken,
    event: {
      title: 'Test event 1',
      description: 'Event number 1',
      tags: ['music', 'jazz'],
      hosts: ['dj felipe'],
      rrule: 'FREQ=WEEKLY;DTSTART=20180920T090000Z;UNTIL=20501221T100000Z;WKST=SU;BYDAY=MO',
      duration: 30,
      tz: 'Europe/London',
    },
  }));

  before('create event 2', () => request(uri.create, {
    token: this.secondAdminToken,
    event: {
      title: 'Test event 2',
      description: 'Event number 2',
      tags: ['music', 'country'],
      hosts: ['dj malboro'],
      rrule: 'FREQ=WEEKLY;DTSTART=20180920T090000Z;UNTIL=20501221T100000Z;WKST=SU;BYDAY=TU',
      duration: 30,
      tz: 'Europe/London',
    },
  }));

  before('create event for group station', () => request(uri.create, {
    token: this.groupAdminToken,
    event: {
      title: 'Test event 3',
      description: 'Event number 3',
      tags: ['music', 'country'],
      hosts: ['dj malboro'],
      rrule: 'FREQ=WEEKLY;DTSTART=20180920T090000Z;UNTIL=20501221T100000Z;WKST=SU;BYDAY=MO',
      duration: 30,
      tz: 'Europe/London',
    },
  }));

  describe('event/list/', () => {
    it('list events by stationGroup', () => request(uri.list, {
      startTime: now().subtract(1, 'months').toISOString(),
      endTime: now().add(1, 'months').toISOString(),
      hosts: ['dj felipe'],
      meta: {
        stationGroup: 'group01',
      },
    })
      .then((response) => {
        const { body, statusCode } = response;

        assert.equal(statusCode, 200);
        assert.ok(body.meta);
        assert.equal(body.meta.count, 1);
        assert.equal(body.data.length, 1);
        assert.equal(body.data[0].type, 'event');
        assert.ok(body.data[0].attributes);
        assert.ok(body.data[0].attributes.title, 'Test event 1');

        return null;
      }));

    it('list events by group stationGroup', () => request(uri.list, {
      startTime: now().subtract(1, 'months').toISOString(),
      endTime: now().add(1, 'months').toISOString(),
      meta: {
        stationGroup: 'group04',
      },
    })
      .then((response) => {
        const { body, statusCode } = response;

        assert.equal(statusCode, 200);
        assert.ok(body.meta);
        assert.equal(body.meta.count, 1);
        assert.equal(body.data.length, 1);
        assert.equal(body.data[0].type, 'event');
        assert.ok(body.data[0].attributes);
        assert.ok(body.data[0].attributes.title, 'Test event 3');

        return null;
      }));

    it('list events by userId', () => request(uri.list, {
      startTime: now().subtract(1, 'months').toISOString(),
      endTime: now().add(1, 'months').toISOString(),
      hosts: ['dj malboro'],
      meta: {
        userId: 'second.admin@foo.com',
      },
    })
      .then((response) => {
        const { body, statusCode } = response;

        assert.equal(statusCode, 200);
        assert.ok(body.meta);
        assert.equal(body.meta.count, 1);
        assert.equal(body.data.length, 1);
        assert.equal(body.data[0].type, 'event');
        assert.ok(body.data[0].attributes);
        assert.ok(body.data[0].attributes.title, 'Test event 2');

        return null;
      }));
  });

  describe('event/tags/list/', () => {

  });
});
