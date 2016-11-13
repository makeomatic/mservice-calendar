/* eslint-disable prefer-arrow-callback */

const Promise = require('bluebird');
const assert = require('assert');
const moment = require('moment-timezone');
const omit = require('lodash/omit');
const assign = require('lodash/assign');
const { debug } = require('../helpers/utils');

describe('Events Suite', function EventsSuite() {
  const Calendar = require('../../src');

  let service;
  before('start service', () => {
    service = this.service = new Calendar(global.SERVICES);
    return service.connect();
  });

  before('wait service', () => Promise.delay(2000));

  const uri = {
    create: 'calendar.event.create',
    update: 'calendar.event.update',
    remove: 'calendar.event.remove',
    list: 'calendar.event.list',
    single: 'calendar.event.single',
    subscribe: 'calendar.event.subscribe',
    build: 'calendar.build',
  };

  const event1 = {
    owner: 'test@test.ru',
    title: 'Test event 1',
    description: 'One time event',
    recurring: false,
    start_time: moment('2100-09-26').tz('Asia/Irkutsk').format(),
    end_time: moment('2100-09-27').tz('Asia/Irkutsk').format(),
  };

  const event2 = {
    owner: 'test@test.ru',
    title: 'Test event 2',
    description: 'Recurring event',
    recurring: true,
    rrule: 'FREQ=WEEKLY;COUNT=30;WKST=MO;BYDAY=TU',
    start_time: moment('2100-09-01 19:30').tz('Asia/Irkutsk').format(),
    end_time: moment('2100-12-01').tz('Asia/Irkutsk').format(),
    duration: 'PT1H',
  };

  describe('Create', function EventCreateSuite() {
    it('Success one-time event', () => service
      .amqp.publishAndWait(uri.create, event1)
      .reflect()
      .then((result) => {
        assert(result.isFulfilled());
        return null;
      }),
    );

    it('Success recurring event', () => service
      .amqp.publishAndWait(uri.create, event2)
      .reflect()
      .then((result) => {
        assert(result.isFulfilled());
        return null;
      }),
    );

    it('Fail with missing rrule for recurring events', () => service
      .amqp.publishAndWait(uri.create, assign(omit(event2, 'rrule'), { id: 'event2_no_rrule' }))
      .reflect()
      .then((result) => {
        assert(result.isRejected());
        return null;
      }),
    );

    it('Fail with invalid rrule for recurring events', () => (
      service
      .amqp.publishAndWait(uri.create, assign({}, event2, { id: 'event2_invalid_rrule', rrule: 'invalid' }))
      .reflect()
      .then((result) => {
        assert(result.isRejected());
        return null;
      })
    ));

    it('Fail on invalid schema', () => (
      service
      .amqp.publishAndWait(uri.create, { id: 'invalid', invalid: true })
      .reflect()
      .then((result) => {
        assert(result.isRejected());
        return null;
      })
    ));
  });

  describe('Update', function EventUpdateSuite() {
    it('Successful update', () => service
      .amqp.publishAndWait(uri.update, {
        id: 1,
        auth: 'test@test.ru',
        event: {
          description: 'Updated description',
        },
      })
      .reflect()
      .then((result) => {
        debug(result);
        assert(result.isFulfilled());
        return null;
      }),
    );

    it('Add subscribers', () => service
      .amqp.publishAndWait(uri.subscribe, {
        event: 1,
        subscriber: 'Vasya',
        notify: true,
      })
      .reflect()
      .then((result) => {
        debug(result);
        assert(result.isFulfilled());
        return null;
      }),
    );

    it('Fail on invalid schema', () => service
      .amqp.publishAndWait(uri.update, {
        id: 1,
        description: 'Updated description',
        wrong: 'field',
      })
      .reflect()
      .then((result) => {
        assert(result.isRejected());
        return null;
      }),
    );

    it('Fail on missing id', () => service
      .amqp.publishAndWait(uri.update, {
        description: 'Updated description',
      })
      .reflect()
      .then((result) => {
        assert(result.isRejected());
        return null;
      }),
    );

    it('Fail for non-existent id', () => service
      .amqp.publishAndWait(uri.update, {
        id: 100500,
        description: 'Updated description',
      })
      .reflect()
      .then((result) => {
        assert(result.isRejected());
        return null;
      }),
    );
  });

  describe('List', function EventListSuite() {
    it('Return single record', () => service
      .amqp.publishAndWait(uri.single, { id: 1 })
      .reflect()
      .then((result) => {
        debug(result);
        assert(result.isFulfilled());
        const instance = result.value();
        assert.notEqual(instance.subscribers.indexOf('Vasya'), -1);
        assert.notEqual(instance.notifications.indexOf('Vasya'), -1);
        assert.equal(instance.title, 'Test event 1');
        return null;
      }),
    );

    it('Return empty list for non-matching query', () => service
      .amqp.publishAndWait(uri.list, {
        where: {
          title: 'Nothing',
        },
      })
      .reflect()
      .then((result) => {
        debug(result);
        assert(result.isFulfilled());
        assert.equal(result.value().length, 0);
        return null;
      }),
    );

    it('Return list', () => service
      .amqp.publishAndWait(uri.list, {
        where: {
          recurring: true,
        },
      })
      .reflect()
      .then((result) => {
        debug(result);
        assert(result.isFulfilled());
        assert.notEqual(result.value().length, 0);
        return null;
      }),
    );

    it('Fail to return single record for non-existent id', () => service
      .amqp.publishAndWait(uri.single, {
        id: 100500,
      })
      .reflect()
      .then((result) => {
        assert(result.isRejected());
        return null;
      }),
    );

    it('Fail to return list on invalid query', () => service
      .amqp.publishAndWait(uri.list, {
        invalid: true,
      })
      .reflect()
      .then((result) => {
        assert(result.isRejected());
        return null;
      }),
    );
  });

  describe('Calendar', function CalendarSuite() {
    it('Return calendar for date range', () => service
      .amqp.publishAndWait(uri.build, {
        start: moment('2100-08-01').tz('Asia/Irkutsk').format(),
        end: moment('2100-10-01').tz('Asia/Irkutsk').format(),
        owner: 'test@test.ru',
      })
      .reflect()
      .then((result) => {
        debug(result, true);
        assert(result.isFulfilled());
        return null;
      }),
    );
  });

  describe('Delete', function EventDeleteSuite() {
    it('Delete single record', () => service
      .amqp.publishAndWait(uri.remove, {
        id: 1,
        auth: 'test@test.ru',
      })
      .reflect()
      .then((result) => {
        debug(result);
        assert(result.isFulfilled());
        return null;
      }),
    );

    it('Delete nothing on non-matching query', () => service
      .amqp.publishAndWait(uri.remove, {
        auth: 'test@test.ru',
        where: {
          id: ['in', [100, 101]],
        },
      })
      .reflect()
      .then((result) => {
        debug(result);
        assert(result.isFulfilled());
        return null;
      }),
    );

    it('Delete by query', () => service
      .amqp.publishAndWait(uri.remove, {
        auth: 'test@test.ru',
        where: {
          id: ['in', [1, 2]],
        },
      })
      .reflect()
      .then((result) => {
        debug(result);
        assert(result.isFulfilled());
        return null;
      }),
    );

    it('Fail to delete on invalid query', () => service
      .amqp.publishAndWait(uri.remove, {
        auth: 'test@test.ru',
        invalid: {
          id: 100500,
        },
      })
      .reflect()
      .then((result) => {
        assert(result.isRejected());
        return null;
      }),
    );
  });
});
