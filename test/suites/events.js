const assert = require('assert');
const moment = require('moment-timezone');
const omit = require('lodash/omit');
const assign = require('lodash/assign');
const request = require('../helpers/request');
const { debug } = require('../helpers/utils');
const { login } = require('../helpers/users');

describe('Events Suite', function EventsSuite() {
  const Calendar = require('../../src');
  const calendar = new Calendar(global.SERVICES);

  before('start service', () => calendar.connect());
  after('stop service', () => calendar.close());

  before('login admin', () => (
    login(calendar.amqp, 'admin@foo.com', 'adminpassword00000')
      .tap(({ jwt }) => (this.adminToken = jwt))
  ));

  before('login user', () => (
    login(calendar.amqp, 'user@foo.com', 'userpassword000000')
      .tap(({ jwt }) => (this.userToken = jwt))
  ));

  const uri = {
    create: 'http://0.0.0.0:3000/api/calendar/event/create',
    update: 'http://0.0.0.0:3000/api/calendar/event/update',
    remove: 'http://0.0.0.0:3000/api/calendar/event/remove',
    list: 'http://0.0.0.0:3000/api/calendar/event/list',
    single: 'http://0.0.0.0:3000/api/calendar/event/single',
    subscribe: 'http://0.0.0.0:3000/api/calendar/event/subscribe',
    build: 'http://0.0.0.0:3000/api/calendar/build',
  };

  const event1 = {
    title: 'Test event 1 - recurring',
    description: 'One time event',
    tags: ['music', 'news', 'jazz'],
    hosts: ['dj maverick', 'dj simons'],
    rrule: 'FREQ=WEEKLY;DTSTART=20160920T210000Z;UNTIL=20161221T090000Z;WKST=SU;BYDAY=MO',
    duration: 30,
  };

  const event2 = {
    title: 'Test event 2',
    description: 'One time event',
    tags: ['music', 'news', 'jazz'],
    hosts: ['dj maverick', 'dj simons'],
    rrule: 'FREQ=WEEKLY;DTSTART=20160920T210000Z;UNTIL=20161221T090000Z;WKST=SU;BYDAY=MO;COUNT=1',
    duration: 60,
  };

  describe('Create', () => {
    it.only('should not be able to create event without token', () => (
      request(uri.create, event1).then((response) => {
        const { body, statusCode } = response;

        assert.equal(statusCode, 400);
        assert.equal(body.statusCode, 400);
        assert.equal(body.error, 'Bad Request');
        assert.equal(body.message, 'event.create validation failed:' +
          ' data should have required property \'token\'');
        assert.equal(body.name, 'ValidationError');

        return null;
      })
    ));

    it.only('should not be able to create event with user token', () => (
      request(uri.create, Object.assign({ token: this.userToken }, event1))
      .then((response) => {
        const { body, statusCode } = response;

        assert.equal(statusCode, 403);
        assert.equal(body.statusCode, 403);
        assert.equal(body.error, 'Forbidden');
        assert.equal(body.message, 'An attempt was made to perform an operation that is not permitted: '
          + 'HttpStatusError: Access to this action is denied');
        assert.equal(body.name, 'HttpStatusError');

        return null;
      })
    ));

    it.only('Create recurring event successfully', () => (
      request(uri.creaate, Object.assign({ token: this.adminToken }, event1))
      .then((response) => {
        const { body, statusCode } = response;
        assert.equal(statusCode, 200);

        // TODO: verify response

        return null;
      })
    ));

    it('Fail with missing rrule for recurring events', () => service
      .amqp.publishAndWait(uri.create, assign(omit(event2, 'rrule'), { id: 'event2_no_rrule' }))
      .reflect()
      .then((result) => {
        assert(result.isRejected());
        return null;
      })
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
      })
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
      })
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
      })
    );

    it('Fail on missing id', () => service
      .amqp.publishAndWait(uri.update, {
        description: 'Updated description',
      })
      .reflect()
      .then((result) => {
        assert(result.isRejected());
        return null;
      })
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
      })
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
      })
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
      })
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
      })
    );

    it('Fail to return single record for non-existent id', () => service
      .amqp.publishAndWait(uri.single, {
        id: 100500,
      })
      .reflect()
      .then((result) => {
        assert(result.isRejected());
        return null;
      })
    );

    it('Fail to return list on invalid query', () => service
      .amqp.publishAndWait(uri.list, {
        invalid: true,
      })
      .reflect()
      .then((result) => {
        assert(result.isRejected());
        return null;
      })
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
      })
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
      })
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
      })
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
      })
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
      })
    );
  });
});
