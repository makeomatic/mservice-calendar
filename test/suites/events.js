const assert = require('assert');
const moment = require('moment');
const request = require('../helpers/request');
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

  const update = {
    rrule: 'FREQ=MONTHLY;DTSTART=20160920T210000Z;UNTIL=20161221T090000Z;WKST=SU;BYDAY=MO',
    duration: 60,
  };

  describe('Create', () => {
    it('should not be able to create event without token', () => (
      request(uri.create, { event: event1 }).then((response) => {
        const { body, statusCode } = response;

        assert.ok(/data should have required property 'token'/.test(body.message));
        assert.equal(statusCode, 400);
        assert.equal(body.statusCode, 400);
        assert.equal(body.error, 'Bad Request');
        assert.equal(body.name, 'ValidationError');

        return null;
      })
    ));

    it('should not be able to create event with user token', () => (
      request(uri.create, { token: this.userToken, event: event1 })
      .then((response) => {
        const { body, statusCode } = response;

        assert.equal(body.message, 'An attempt was made to perform an operation that is not permitted: '
          + 'HttpStatusError: Access to this action is denied');
        assert.equal(statusCode, 403);
        assert.equal(body.statusCode, 403);
        assert.equal(body.error, 'Forbidden');
        assert.equal(body.name, 'NotPermittedError');

        return null;
      })
    ));

    it('Create recurring event successfully', () => (
      request(uri.create, { token: this.adminToken, event: Object.assign({}, event1) })
      .then((response) => {
        const { body, statusCode } = response;

        assert.equal(statusCode, 200);
        assert.ok(body.data);
        assert.ok(body.data.id);
        assert.deepEqual(body.data.attributes, Object.assign({ owner: 'admin@foo.com' }, event1));

        return null;
      })
    ));
  });

  describe('List events', () => {
    it('should return a sample list of events', () => (
      request(uri.list, {
        owner: 'admin@foo.com',
        tags: ['music', 'news'],
        hosts: ['dj simons', 'borkman'],
        startTime: moment().subtract(1, 'months').toISOString(),
        endTime: moment().add(1, 'months').toISOString(),
      })
      .then((response) => {
        const { body, statusCode } = response;

        assert.equal(statusCode, 200);
        assert.ok(body.meta);
        assert.equal(body.meta.cursor, 1);
        assert.equal(body.meta.count, 1);
        assert.equal(body.data.length, 1);
        assert.equal(body.data[0].id, 1);
        assert.equal(body.data[0].type, 'event');
        assert.ok(body.data[0].attributes);

        assert.deepEqual(body.data[0].attributes, Object.assign({
          start_time: [
            '2016-10-17T21:00:00+00:00',
            '2016-10-24T21:00:00+00:00',
            '2016-10-31T21:00:00+00:00',
            '2016-11-07T21:00:00+00:00',
            '2016-11-14T21:00:00+00:00',
            '2016-11-21T21:00:00+00:00',
            '2016-11-28T21:00:00+00:00',
            '2016-12-05T21:00:00+00:00',
            '2016-12-12T21:00:00+00:00',
          ],
        }, event1));

        return null;
      })
    ));
  });

  describe('update event', () => {
    it('should fail to update event when we rrule, but not duration', () => (
      request(uri.update, { id: 1, token: this.adminToken, event: { rrule: update.rrule } })
      .then((response) => {
        const { body, statusCode } = response;

        assert.ok(/data should have required property 'duration'/.test(body.message));
        assert.equal(statusCode, 400);
        assert.equal(body.statusCode, 400);
        assert.equal(body.error, 'Bad Request');
        assert.equal(body.name, 'ValidationError');

        return null;
      })
    ));

    it('should fail to update event when we duration, but not rrule', () => {

    });

    it('should fail to update when owner does not match', () => {

    });

    it('should update only meta information when no rrule or duration present', () => {

    });

    it('should update event periods when rrule & duration is present', () => {

    });
  });
});
