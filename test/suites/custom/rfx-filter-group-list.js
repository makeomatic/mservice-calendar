const assert = require('assert');
const moment = require('moment-timezone');
const extend = require('lodash/extend');
const request = require('../../helpers/request');
const { login } = require('../../helpers/users');

describe('rfx-filter-group-list hook test suite', function suite() {
  const Calendar = require('../../../src');
  const calendar = new Calendar(extend({}, global.SERVICES, {
    hooks: { 'event:list:post': require('../../../src/custom/rfx-filter-group-list.js') },
  }));
  const now = () => moment(new Date(2018, 10, 16));
  const uri = {
    create: 'http://0.0.0.0:3000/api/calendar/event/create',
    list: 'http://0.0.0.0:3000/api/calendar/event/list',
  };

  before('start service', () => calendar.connect());
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

  before('create event 1', () => request(uri.create, {
    token: this.firstAdminToken,
    event: {
      title: 'Test event 1',
      description: 'Event number 1',
      tags: ['music', 'jazz'],
      hosts: ['dj felipe'],
      rrule: 'FREQ=WEEKLY;DTSTART=20180920T090000Z;UNTIL=20181221T100000Z;WKST=SU;BYDAY=MO',
      duration: 30,
    },
  }));

  before('create event 2', () => request(uri.create, {
    token: this.secondAdminToken,
    event: {
      title: 'Test event 2',
      description: 'Event number 2',
      tags: ['music', 'country'],
      hosts: ['dj malboro'],
      rrule: 'FREQ=WEEKLY;DTSTART=20180920T090000Z;UNTIL=20181221T100000Z;WKST=SU;BYDAY=TU',
      duration: 30,
    },
  }));

  describe('event/list/', () => {  
    it('list events by stationGroup', () =>
      request(uri.list, {
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

    it('list events by userId', () =>
      request(uri.list, {
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
