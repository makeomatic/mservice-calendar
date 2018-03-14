const assert = require('assert');
const moment = require('moment-timezone');
const request = require('../helpers/request');
const { login } = require('../helpers/users');
const { omit } = require('lodash');

describe('Events Suite', function EventsSuite() {
  const Calendar = require('../../src');
  const calendar = new Calendar(global.SERVICES);
  const now = () => moment(new Date(2018, 10, 16));

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
    createTag: 'http://0.0.0.0:3000/api/calendar/event/tags/create',
    updateTag: 'http://0.0.0.0:3000/api/calendar/event/tags/update',
    listTags: 'http://0.0.0.0:3000/api/calendar/event/tags/list',
    removeTag: 'http://0.0.0.0:3000/api/calendar/event/tags/delete',
  };

  const event1 = {
    title: 'Test event 1 - recurring',
    description: 'One time event',
    tags: ['music', 'news', 'jazz'],
    hosts: ['dj maverick', 'dj simons'],
    rrule: 'FREQ=WEEKLY;DTSTART=20180920T210000Z;UNTIL=20181221T090000Z;WKST=SU;BYDAY=MO',
    duration: 30,
    tz: 'America/Chicago',
  };

  const event2 = {
    title: 'Test event 2 - start right after 1',
    description: 'recurring',
    rrule: 'FREQ=WEEKLY;DTSTART=20180920T213000Z;UNTIL=20181221T090000Z;WKST=SU;BYDAY=MO',
    duration: 30,
    tz: 'Europe/Moscow',
  };

  const update = {
    // In-case of MONTHLY we MUST specify day of which week we want to use. Every 3rd monday
    // otherwise monthly would only mean this day
    // We can also remove BYDAY and it will be months starting from DTSTART and + month
    rrule: 'FREQ=MONTHLY;DTSTART=20180920T210000Z;UNTIL=20181221T090000Z;WKST=SU;BYDAY=3MO', 
    duration: 15,
  };

  describe('Create', () => {
    it('should not be able to create event without token', () => (
      request(uri.create, { event: event1 }).then((response) => {
        const { body, statusCode } = response;

        assert.ok(/data should have required property 'token'/.test(body.message), JSON.stringify(body));
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

        assert.equal(statusCode, 200, JSON.stringify(body));
        assert.ok(body.data);
        assert.ok(body.data.id);

        const comparison = Object.assign({ owner: 'admin@foo.com' }, event1);
        delete comparison.tz;
        assert.deepEqual(body.data.attributes, comparison);

        return null;
      })
    ));

    it('Rejects to create overlapping recurring event', () => (
      request(uri.create, { token: this.adminToken, event: Object.assign({}, event1) })
      .then((response) => {
        const { body, statusCode } = response;

        assert.notEqual(statusCode, 200);
        assert.equal(body.error, 'Bad Request');
        assert.equal(
          body.message,
          'You want to create an event starting at Mon, Sep 24, 2018 4:00 PM, ' +
          'but it overlaps with another one at Mon, Sep 24, 2018 4:00 PM'
        );
        assert.equal(body.name, 'ValidationError');

        return null;
      })
    ));

    it('Allows to create event right after the first one', () => (
      request(uri.create, { token: this.adminToken, event: Object.assign({}, event2) })
      .then((response) => {
        const { body, statusCode } = response;

        assert.equal(statusCode, 200);
        assert.ok(body.data);
        assert.ok(body.data.id);

        const comparison = Object.assign({ owner: 'admin@foo.com', tags: [], hosts: [] }, event2);
        delete comparison.tz;

        assert.deepEqual(body.data.attributes, comparison);

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
        startTime: now().subtract(1, 'months').toISOString(),
        endTime: now().add(1, 'months').toISOString(),
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

        const precalculatedTime = Object.assign({
          start_time: [
            '2018-10-22T21:00:00+00:00',
            '2018-10-29T21:00:00+00:00',
            '2018-11-05T21:00:00+00:00',
            '2018-11-12T21:00:00+00:00',
            '2018-11-19T21:00:00+00:00',
            '2018-11-26T21:00:00+00:00',
            '2018-12-03T21:00:00+00:00',
            '2018-12-10T21:00:00+00:00',
          ],
          owner: 'admin@foo.com',
        }, event1);

        delete precalculatedTime.tz;

        assert.deepEqual(
          body.data[0].attributes,
          precalculatedTime,
          JSON.stringify({ start: body.data[0].attributes.start_time, end: precalculatedTime.start_time })
        );

        return null;
      })
    ));

    it('should return a sample list of events for supplied tags', () => (
      request(uri.list, {
        tags: ['music', 'news'],
        startTime: now().subtract(1, 'months').toISOString(),
        endTime: now().add(1, 'months').toISOString(),
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

        const precalculatedTime = Object.assign({
          start_time: [
            '2018-10-22T21:00:00+00:00',
            '2018-10-29T21:00:00+00:00',
            '2018-11-05T21:00:00+00:00',
            '2018-11-12T21:00:00+00:00',
            '2018-11-19T21:00:00+00:00',
            '2018-11-26T21:00:00+00:00',
            '2018-12-03T21:00:00+00:00',
            '2018-12-10T21:00:00+00:00',
          ],
          owner: 'admin@foo.com',
        }, event1);

        delete precalculatedTime.tz;

        assert.deepEqual(
          body.data[0].attributes,
          precalculatedTime,
          JSON.stringify({ start: body.data[0].attributes.start_time, end: precalculatedTime.start_time })
        );

        return null;
      })
    ));
  });

  describe('update event', () => {
    it('should fail to update event when we supply rrule, but not duration', () => (
      request(uri.update, { id: 1, token: this.adminToken, event: { rrule: update.rrule } })
      .then((response) => {
        const { body, statusCode } = response;

        assert.ok(/data\.event should have property duration when property rrule is present/.test(body.message), JSON.stringify(body));
        assert.equal(statusCode, 400);
        assert.equal(body.statusCode, 400);
        assert.equal(body.error, 'Bad Request');
        assert.equal(body.name, 'ValidationError');

        return null;
      })
    ));

    it('should fail to update event when we supply duration, but not rrule', () => (
      request(uri.update, { id: 1, token: this.adminToken, event: { duration: 60 } })
      .then((response) => {
        const { body, statusCode } = response;

        assert.ok(/data\.event should have property rrule when property duration is present/.test(body.message), JSON.stringify(body));
        assert.equal(statusCode, 400);
        assert.equal(body.statusCode, 400);
        assert.equal(body.error, 'Bad Request');
        assert.equal(body.name, 'ValidationError');

        return null;
      })
    ));

    it.skip('should fail to update when owner does not match', () => {
      // TODO: login another admin and try to update event before
    });

    it('should update only meta information when no rrule or duration present', () => (
      request(uri.update, { id: 1, token: this.adminToken, event: { title: 'nom-nom' } })
      .then((response) => {
        const { statusCode } = response;
        assert.equal(statusCode, 200);
        return null;
      })
    ));

    it('should update event periods when rrule & duration is present', () => (
      request(uri.update, { id: 1, token: this.adminToken, event: update })
      .then((response) => {
        const { statusCode } = response;
        assert.equal(statusCode, 200);
        return null;
      })
    ));

    it('should return a sample list of updated events', () => (
      request(uri.list, {
        owner: 'admin@foo.com',
        tags: ['music', 'news'],
        hosts: ['dj simons', 'borkman'],
        startTime: now().subtract(1, 'months').toISOString(),
        endTime: now().add(1, 'months').toISOString(),
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

        const precalculatedTime = Object.assign({
          start_time: [
            '2018-11-19T21:00:00+00:00',
          ],
          owner: 'admin@foo.com',
        }, event1, update, { title: 'nom-nom' });

        delete precalculatedTime.tz;

        assert.deepEqual(body.data[0].attributes, precalculatedTime);

        return null;
      })
    ));
  });

  describe('tags', () => {
    const tag = {
      id: 'awesome-tag',
      section: 'music',
      eng: 'The Best of Tags',
      cover: 'https://example.com/top.jpeg',
      icon: 'http://bad.icon/top.png',
      priority: 10,
    };

    const updatedTag = {
      id: 'awesome-tag',
      section: 'music',
      eng: 'Not the Best of Tags',
      cover: 'https://example.com/bottom.jpeg',
      icon: 'http://bad.icon/bottom.png',
      priority: 10,
    };

    const startTime = now().toISOString();
    const endTime = now().add(2, 'month').toISOString();

    it('allows to create a tag', () => (
      request(uri.createTag, {
        tag,
        token: this.adminToken,
      })
      .then((response) => {
        assert.equal(response.statusCode, 200);
        assert.deepEqual(response.body.data, {
          id: tag.id,
          type: 'tag',
          attributes: omit(tag, 'id'),
        });
        return null;
      })
    ));

    it('returns all tags', () => (
      request(uri.listTags, { active: false, startTime, endTime })
      .then((response) => {
        assert.equal(response.statusCode, 200);
        assert.deepEqual(response.body.data, [{
          id: tag.id,
          type: 'tag',
          attributes: omit(tag, 'id'),
        }]);
        return null;
      })
    ));

    it('returns active tags', () => (
      request(uri.listTags, { active: true, startTime, endTime })
      .then((response) => {
        assert.equal(response.statusCode, 200);
        assert.deepEqual(response.body.data, []);
        return null;
      })
    ));

    it('adds event with a tag', () => (
      request(uri.update, { id: 1, token: this.adminToken, event: { tags: [tag.id] } })
      .then(() => request(uri.listTags, { active: true, startTime, endTime }))
      .then((response) => {
        assert.equal(response.statusCode, 200);
        assert.deepEqual(response.body.data, [{
          id: tag.id,
          type: 'tag',
          attributes: omit(tag, 'id'),
        }]);
        return null;
      })
    ));

    it('allows to update a tag', () => (
      request(uri.updateTag, {
        tag: updatedTag,
        token: this.adminToken,
      })
      .then((response) => {
        assert.equal(response.statusCode, 200);
        assert.deepEqual(response.body.data, {
          id: updatedTag.id,
          type: 'tag',
          attributes: omit(updatedTag, 'id'),
        });
        return null;
      })
    ));

    it('removes tag', () => (
      request(uri.removeTag, { token: this.adminToken, tag: tag.id })
      .then((response) => {
        assert.equal(response.statusCode, 200);
        return null;
      })
    ));

    it('returns active tags after removal', () => (
      request(uri.listTags, { active: true, startTime, endTime })
      .then((response) => {
        assert.equal(response.statusCode, 200);
        assert.deepEqual(response.body.data, []);
        return null;
      })
    ));
  });

  // removes event completely
  describe('remove event', () => {
    it('allows owner to remove event', () => (
      request(uri.remove, { id: 1, token: this.adminToken })
      .then((response) => {
        const { statusCode } = response;
        assert.equal(statusCode, 200);
        return null;
      })
    ));

    it('should return a sample list of updated events', () => (
      request(uri.list, {
        owner: 'admin@foo.com',
        startTime: now().subtract(1, 'year').toISOString(),
        endTime: now().add(1, 'year').toISOString(),
      })
      .then((response) => {
        const { body, statusCode } = response;

        assert.equal(statusCode, 200);
        assert.ok(body.meta);
        assert.equal(body.meta.count, 1);
        assert.equal(body.data.length, 1);

        assert.equal(statusCode, 200);
        assert.ok(body.meta);
        assert.equal(body.meta.cursor, 3);
        assert.equal(body.meta.count, 1);
        assert.equal(body.data.length, 1);
        assert.equal(body.data[0].id, 3);
        assert.equal(body.data[0].type, 'event');
        assert.ok(body.data[0].attributes);

        return null;
      })
    ));
  });
});
