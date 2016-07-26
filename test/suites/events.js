/* eslint-disable prefer-arrow-callback */

const Promise = require('bluebird');
const assert = require('assert');
const moment = require('moment-timezone');
const omit = require('lodash/omit');
const assign = require('lodash/assign');
const { debug } = require('../helpers/utils');

describe('Events Suite', function EventsSuite() {
  const Calendar = require('../../lib');

  const host = process.env.CRATE_HOST || '127.0.0.1';
  const connectionString = `http://${host}:4200`;
  const service = new Calendar({
    crate: {
      namespace: 'test_calendar',
      connectionString,
    },
  });

  const createHeaders = { routingKey: 'calendar.events.create' };
  const updateHeaders = { routingKey: 'calendar.events.update' };
  const deleteHeaders = { routingKey: 'calendar.events.remove' };
  const listHeaders = { routingKey: 'calendar.events.list' };
  const singleHeaders = { routingKey: 'calendar.events.single' };
  const subscribeHeaders = { routingKey: 'calendar.events.subscribe' };
  const calendarHeaders = { routingKey: 'calendar.events.calendar' };

  const event1 = {
    id: 'event1',
    owner: 'test@test.ru',
    title: 'Test event 1',
    description: 'One time event',
    recurring: false,
    start_time: moment('2016-09-26').valueOf(),
    end_time: moment('2016-09-27').valueOf(),
    timezone: 'Asia/Irkutsk',
  };

  const event2 = {
    id: 'event2',
    owner: 'test@test.ru',
    title: 'Test event 2',
    description: 'Recurring event',
    recurring: true,
    rrule: 'FREQ=WEEKLY;COUNT=30;WKST=MO;BYDAY=TU',
    start_time: moment('2016-09-01 19:30').valueOf(),
    end_time: moment('2016-12-01').valueOf(),
    duration: 'PT1H',
    timezone: 'Asia/Irkutsk',
  };

  before('Migrate table', () => service.migrate());
  after('Cleanup table', () => service.cleanup());

  describe('Create', function EventCreateSuite() {
    it('Success one-time event', () => service
      .router(event1, createHeaders)
      .reflect()
      .then(result => {
        assert(result.isFulfilled());
        return null;
      })
    );

    it('Success recurring event', () => service
      .router(event2, createHeaders)
      .reflect()
      .then(result => {
        assert(result.isFulfilled());
        return null;
      })
    );

    it('Fail with existing id', () => service
      .router(event1, createHeaders)
      .reflect()
      .then(result => {
        assert(result.isRejected());
        return null;
      })
    );

    it('Fail without id', () => service
      .router(omit(event1, 'id'), createHeaders)
      .reflect()
      .then(result => {
        assert(result.isRejected());
        return null;
      })
    );

    it('Fail with missing rrule for recurring events', () => service
      .router(assign(omit(event2, 'rrule'), {
        id: 'event2_no_rrule',
      }), createHeaders)
      .reflect()
      .then(result => {
        assert(result.isRejected());
        return null;
      })
    );

    it('Fail with invalid rrule for recurring events', () => service
      .router(assign({}, event2, {
        id: 'event2_invalid_rrule',
        rrule: 'invalid',
      }), createHeaders)
      .reflect()
      .then(result => {
        assert(result.isRejected());
        return null;
      })
    );

    it('Fail on invalid schema', () => service
      .router({
        id: 'invalid',
        invalid: true,
      }, createHeaders)
      .reflect()
      .then(result => {
        assert(result.isRejected());
        return null;
      })
    );
  });

  describe('Update', function EventUpdateSuite() {
    it('Successful update', () => service
      .router({
        id: event1.id,
        auth: 'test@test.ru',
        event: {
          description: 'Updated description',
        },
      }, updateHeaders)
      .reflect()
      .then(result => {
        debug(result);
        assert(result.isFulfilled());
        assert.equal(result.value().instance.description, 'Updated description');
        return null;
      })
    );

    it('Add subscribers', () => service
      .router({
        event: event1.id,
        subscriber: 'Vasya',
        notify: true,
      }, subscribeHeaders)
      .reflect()
      .then(result => {
        debug(result);
        assert(result.isFulfilled());
        const instance = result.value();
        assert.notEqual(instance.subscribers.indexOf('Vasya'), -1);
        assert.notEqual(instance.notifications.indexOf('Vasya'), -1);
        return null;
      })
    );

    it('Fail on invalid schema', () => service
      .router({
        id: event1.id,
        description: 'Updated description',
        wrong: 'field',
      }, updateHeaders)
      .reflect()
      .then(result => {
        assert(result.isRejected());
        return null;
      })
    );

    it('Fail on missing id', () => service
      .router({
        description: 'Updated description',
      }, updateHeaders)
      .reflect()
      .then(result => {
        assert(result.isRejected());
        return null;
      })
    );

    it('Fail for non-existent id', () => service
      .router({
        id: 'invalid',
        description: 'Updated description',
      }, updateHeaders)
      .reflect()
      .then(result => {
        assert(result.isRejected());
        return null;
      })
    );
  });

  describe('List', function EventListSuite() {
    this.timeout(10000);
    before(() => Promise.delay(1000));

    it('Return single record', () => service
      .router({
        id: event1.id,
      }, singleHeaders)
      .reflect()
      .then(result => {
        debug(result);
        assert(result.isFulfilled());
        const instance = result.value();
        assert.notEqual(instance.subscribers.indexOf('Vasya'), -1);
        assert.notEqual(instance.notifications.indexOf('Vasya'), -1);
        assert.equal(instance.title, 'Test event 1');
        return null;
      })
    );

    it('Return empty list for non-matching query', () => service
      .router({
        where: {
          title: 'Nothing',
        },
      }, listHeaders)
      .reflect()
      .then(result => {
        debug(result);
        assert(result.isFulfilled());
        assert.equal(result.value().length, 0);
        return null;
      })
    );

    it('Return list', () => service
      .router({
        where: {
          recurring: true,
        },
      }, listHeaders)
      .reflect()
      .then(result => {
        debug(result);
        assert(result.isFulfilled());
        assert.notEqual(result.value().length, 0);
        return null;
      })
    );

    it('Fail to return single record for non-existent id', () => service
      .router({
        id: 'invalid',
      }, singleHeaders)
      .reflect()
      .then(result => {
        assert(result.isRejected());
        return null;
      })
    );

    it('Fail to return list on invalid query', () => service
      .router({
        invalid: true,
      }, listHeaders)
      .reflect()
      .then(result => {
        assert(result.isRejected());
        return null;
      })
    );
  });

  describe('Calendar', function CalendarSuite() {
    it('Return calendar for date range', () => service
      .router({
        start: moment('2016-08-01').valueOf(),
        end: moment('2016-10-01').valueOf(),
      }, calendarHeaders)
      .reflect()
      .then(result => {
        debug(result);
        assert(result.isFulfilled());
        return null;
      })
    );
  });

  describe('Delete', function EventDeleteSuite() {
    this.timeout(15000);
    beforeEach(() => Promise.delay(1000));

    it('Delete single record', () => service
      .router({
        id: event1.id,
        auth: 'test@test.ru',
      }, deleteHeaders)
      .reflect()
      .then(result => {
        debug(result);
        assert(result.isFulfilled());
        return null;
      })
    );

    it('Delete nothing on non-matching query', () => service
      .router({
        auth: 'test@test.ru',
        where: {
          id: ['like', '%empty%'],
        },
      }, deleteHeaders)
      .reflect()
      .then(result => {
        debug(result);
        assert(result.isFulfilled());
        return null;
      })
    );

    it('Delete by query', () => service
      .router({
        auth: 'test@test.ru',
        where: {
          id: ['like', '%event%'],
        },
      }, deleteHeaders)
      .reflect()
      .then(result => {
        debug(result);
        assert(result.isFulfilled());
        return null;
      })
    );

    it('Fail to delete on invalid query', () => service
      .router({
        auth: 'test@test.ru',
        invalid: {
          id: 'invalid',
        },
      }, deleteHeaders)
      .reflect()
      .then(result => {
        assert(result.isRejected());
        return null;
      })
    );
  });
});
