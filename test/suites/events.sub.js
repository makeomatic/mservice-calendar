const assert = require('assert');
const moment = require('moment');
const uniqBy = require('lodash/uniqBy');
const request = require('../helpers/request');
const { login } = require('../helpers/users');

describe('Events Subscription Suite', function suite() {
  const Calendar = require('../../src');
  const { EVENT_TABLE } = require('../../src/constants');
  const calendar = new Calendar(global.SERVICES);
  const uri = {
    create: 'http://0.0.0.0:3000/api/calendar/event/create',
    remove: 'http://0.0.0.0:3000/api/calendar/event/remove',
    subscribe: 'http://0.0.0.0:3000/api/calendar/event/subscribe',
    unsubscribe: 'http://0.0.0.0:3000/api/calendar/event/unsubscribe',
    subsList: 'http://0.0.0.0:3000/api/calendar/event/subs/list',
  };

  before('start service', async () => {
    await calendar.connect();
    await calendar.knex.raw(`DELETE FROM ${EVENT_TABLE}`);
  });

  before('login first admin', () => (
    login(calendar.amqp, 'admin@foo.com', 'adminpassword00000')
      .tap(({ jwt }) => { this.adminToken = jwt; })
  ));

  before('login first user', () => (
    login(calendar.amqp, 'user@foo.com', 'userpassword000000')
      .tap(({ jwt }) => { this.firstUserToken = jwt; })
  ));

  before('create event', () => request(uri.create, {
    token: this.adminToken,
    event: {
      title: 'Super Show',
      description: 'It\'s an amazing show powered by Felipex.',
      tags: ['music', 'country'],
      hosts: ['dj felipe'],
      rrule: 'FREQ=WEEKLY;DTSTART=20180720T090000Z;UNTIL=20501221T100000Z;WKST=SU;BYDAY=MO',
      duration: 30,
      tz: 'Europe/London',
    },
  }).then(({ body }) => {
    this.firstEventId = body.data.id;
    return null;
  }));

  after('delete event', () => request(uri.remove, { token: this.adminToken, id: this.firstEventId }));

  after('stop service', () => calendar.close());

  describe('Subscribe', () => {
    it('should return an error if missing event id', () => (
      request(uri.subscribe, {
        token: this.firstUserToken,
      }).then(({ body, statusCode }) => {
        assert.ok(/data should have required property 'id'/.test(body.message), JSON.stringify(body));
        assert.equal(statusCode, 400);
        assert.equal(body.statusCode, 400);
        assert.equal(body.error, 'Bad Request');
        assert.equal(body.name, 'HttpStatusError');
        return null;
      })
    ));

    it('should return an error if missing token', () => (
      request(uri.subscribe, {
        id: this.firstEventId,
      }).then(({ body, statusCode }) => {
        assert.ok(/data should have required property 'token'/.test(body.message), JSON.stringify(body));
        assert.equal(statusCode, 400);
        assert.equal(body.statusCode, 400);
        assert.equal(body.error, 'Bad Request');
        assert.equal(body.name, 'HttpStatusError');
        return null;
      })
    ));

    it('should return an error if wrong authentication', () => (
      request(uri.subscribe, {
        token: 'asdrt454rwefadqwfsfdgvse.wqeqwe23weg6t34rasdad.32ewqdafsdffawd3afas',
        id: this.firstEventId,
      }).then(({ body, statusCode }) => {
        assert.equal(statusCode, 401);
        assert.equal(body.statusCode, 401);
        assert.equal(body.error, 'Unauthorized');
        assert.equal(body.name, 'AuthenticationRequiredError');
        return null;
      })
    ));

    it('should be to subscribe successfully', () => (
      request(uri.subscribe, {
        token: this.firstUserToken,
        id: this.firstEventId,
      }).then(({ statusCode }) => {
        assert.equal(statusCode, 200);
        return null;
      })
    ));

    it('should return an error trying to subscribe to same event', () => (
      request(uri.subscribe, {
        token: this.firstUserToken,
        id: this.firstEventId,
      }).then(({ body, statusCode }) => {
        assert.equal(statusCode, 403);
        assert.equal(body.statusCode, 403);
        assert.equal(body.error, 'Forbidden');
        assert.equal(body.name, 'NotPermittedError');
        return null;
      })
    ));

    it('should return an error if event does not exist', () => (
      request(uri.subscribe, {
        token: this.firstUserToken,
        id: 1000,
      }).then(({ body, statusCode }) => {
        assert.equal(statusCode, 404);
        assert.equal(body.statusCode, 404);
        assert.equal(body.error, 'Not Found');
        assert.equal(body.name, 'NotFoundError');
        return null;
      })
    ));
  });

  describe('List Subscriptions', () => {
    let secondUserToken;
    let secondEventId;

    before('login user', () => (
      login(calendar.amqp, 'second.user@foo.com', 'seconduserpassword')
        .tap(({ jwt }) => { secondUserToken = jwt; })
    ));

    before('create event', () => request(uri.create, {
      token: this.adminToken,
      event: {
        title: 'Big Show!',
        description: 'Such a big show!',
        tags: ['music', 'pop'],
        hosts: ['dj malboro'],
        rrule: 'FREQ=WEEKLY;DTSTART=20180720T090000Z;UNTIL=20501221T100000Z;WKST=SU;BYDAY=TU',
        duration: 60,
        tz: 'Europe/London',
      },
    })
      .then(({ body }) => { secondEventId = body.data.id; }));

    before('subscribe to event', () => request(uri.subscribe, {
      token: this.firstUserToken,
      id: secondEventId,
    }));

    before('subscribe to event', () => request(uri.subscribe, {
      token: secondUserToken,
      id: secondEventId,
    }));

    after('delete event', () => request(uri.remove, {
      token: this.adminToken,
      id: secondEventId,
    }));

    it('should return an error if filter is missing', () => {
      return request(uri.subsList, {
        token: this.adminToken,
      }).then(({ body, statusCode }) => {
        assert.ok(/data should have required property 'filter'/.test(body.message), JSON.stringify(body));
        assert.equal(statusCode, 400);
        assert.equal(body.statusCode, 400);
        assert.equal(body.error, 'Bad Request');
        assert.equal(body.name, 'HttpStatusError');
        return null;
      });
    });

    it('should return an error if token is missing', () => {
      return request(uri.subsList, {
        filter: {
          id: secondEventId,
        },
      }).then(({ body, statusCode }) => {
        assert.ok(/data should have required property 'token'/.test(body.message), JSON.stringify(body));
        assert.equal(statusCode, 400);
        assert.equal(body.statusCode, 400);
        assert.equal(body.error, 'Bad Request');
        assert.equal(body.name, 'HttpStatusError');
        return null;
      });
    });

    it('should return a list of subscriptions filtering by event', () => (
      request(uri.subsList, {
        token: this.adminToken,
        filter: {
          id: secondEventId,
        },
      }).then(({ body, statusCode }) => {
        assert.equal(statusCode, 200);
        assert.ok(body.meta);
        assert.equal(body.meta.count, 2);
        assert.equal(body.data.length, 2);

        const uniqByEventId = uniqBy(body.data, 'id');

        assert.equal(uniqByEventId.length, 1);
        assert.equal(uniqByEventId[0].id, secondEventId);
        assert.equal(uniqByEventId[0].type, 'eventSub');
        assert.ok(uniqByEventId[0].attributes);
        assert.ok(uniqByEventId[0].attributes.username);
        assert.ok(uniqByEventId[0].attributes.title);
        assert.ok(uniqByEventId[0].attributes.description);
        assert.ok(uniqByEventId[0].attributes.rrule);
        assert.ok(uniqByEventId[0].attributes.tags);
        assert.ok(uniqByEventId[0].attributes.hosts);
        assert.ok(uniqByEventId[0].attributes.duration);
        assert.ok(uniqByEventId[0].attributes.owner);
        return null;
      })
    ));

    it('should return a list of subscriptions filtering by username', () => (
      request(uri.subsList, {
        token: this.adminToken,
        filter: {
          username: 'user@foo.com',
        },
      }).then(({ body, statusCode }) => {
        assert.equal(statusCode, 200);
        assert.ok(body.meta);
        assert.equal(body.meta.count, 2);
        assert.equal(body.data.length, 2);

        const uniqByUsername = uniqBy(body.data, 'attributes.username');

        assert.equal(uniqByUsername.length, 1);
        assert.ok(uniqByUsername[0].id);
        assert.equal(uniqByUsername[0].type, 'eventSub');
        assert.ok(uniqByUsername[0].attributes);
        assert.equal(uniqByUsername[0].attributes.username, 'user@foo.com');
        assert.ok(uniqByUsername[0].attributes.title);
        assert.ok(uniqByUsername[0].attributes.description);
        assert.ok(uniqByUsername[0].attributes.rrule);
        assert.ok(uniqByUsername[0].attributes.tags);
        assert.ok(uniqByUsername[0].attributes.hosts);
        assert.ok(uniqByUsername[0].attributes.duration);
        assert.ok(uniqByUsername[0].attributes.owner);
        return null;
      })
    ));

    it('should return a list of subscriptions filtering by event and username', () => (
      request(uri.subsList, {
        token: this.adminToken,
        filter: {
          id: this.firstEventId,
          username: 'user@foo.com',
        },
      }).then(({ body, statusCode }) => {
        assert.equal(statusCode, 200);
        assert.ok(body.meta);
        assert.equal(body.meta.count, 1);
        assert.equal(body.data.length, 1);

        assert.equal(body.data[0].id, this.firstEventId);
        assert.equal(body.data[0].type, 'eventSub');
        assert.ok(body.data[0].attributes);
        assert.equal(body.data[0].attributes.username, 'user@foo.com');
        assert.ok(body.data[0].attributes.title);
        assert.ok(body.data[0].attributes.description);
        assert.ok(body.data[0].attributes.rrule);
        assert.ok(body.data[0].attributes.tags);
        assert.ok(body.data[0].attributes.hosts);
        assert.ok(body.data[0].attributes.duration);
        assert.ok(body.data[0].attributes.owner);
        return null;
      })
    ));

    it('should not return subscriptions if event is out of range', () => request(uri.subsList, {
      token: this.adminToken,
      filter: {
        id: this.firstEventId,
        startTime: moment.utc('20180720T090000Z').subtract(1, 'years').toDate(),
        endTime: moment.utc('20180720T090000Z').subtract(6, 'months').toDate(),
      },
    }).then(({ body, statusCode }) => {
      assert.equal(statusCode, 200);
      assert.ok(body.meta);
      assert.equal(body.meta.count, 0);
      assert.equal(body.data.length, 0);
      return null;
    }));

    it('should return a list of subscriptions filtering by event and date', () => (
      request(uri.subsList, {
        token: this.adminToken,
        filter: {
          id: this.firstEventId,
          startTime: moment.utc().toDate(),
          endTime: moment.utc().add(1, 'month').toDate(),
        },
      }).then(({ body, statusCode }) => {
        assert.equal(statusCode, 200);
        assert.ok(body.meta);
        assert.equal(body.meta.count, 1);
        assert.equal(body.data.length, 1);

        assert.equal(body.data[0].id, this.firstEventId);
        assert.equal(body.data[0].type, 'eventSub');
        assert.ok(body.data[0].attributes);
        assert.equal(body.data[0].attributes.username, 'user@foo.com');
        assert.ok(body.data[0].attributes.title);
        assert.ok(body.data[0].attributes.description);
        assert.ok(body.data[0].attributes.rrule);
        assert.ok(body.data[0].attributes.tags);
        assert.ok(body.data[0].attributes.hosts);
        assert.ok(body.data[0].attributes.duration);
        assert.ok(body.data[0].attributes.owner);
        return null;
      })
    ));

    it('should return a list of subscriptions filtering by events id', () => (
      request(uri.subsList, {
        token: this.adminToken,
        filter: {
          ids: [this.firstEventId, secondEventId],
        },
      }).then(({ body, statusCode }) => {
        assert.equal(statusCode, 200);
        assert.ok(body.meta);
        assert.equal(body.meta.count, 3);
        assert.equal(body.data.length, 3);

        for (let i = 0; i < body.meta.count; i += 1) {
          const { id, type, attributes } = body.data[i];

          assert.equal(type, 'eventSub');
          assert.ok(attributes);
          assert.equal(attributes.owner, 'admin@foo.com');
          assert.ok(attributes.title);
          assert.ok(attributes.description);
          assert.ok(attributes.rrule);
          assert.ok(attributes.tags);
          assert.ok(attributes.hosts);
          assert.ok(attributes.duration);

          if (id === this.firstEventId) {
            assert.equal(attributes.username, 'user@foo.com');
          } else if (id === secondEventId) {
            assert(attributes.username === 'user@foo.com' || attributes.username === 'second.user@foo.com');
          }
        }
        return null;
      })
    ));
  });

  describe('Unsubscribe', () => {
    it('should return an error if missing event id', () => (
      request(uri.unsubscribe, {
        token: this.firstUserToken,
      }).then(({ body, statusCode }) => {
        assert.ok(/data should have required property 'id'/.test(body.message), JSON.stringify(body));
        assert.equal(statusCode, 400);
        assert.equal(body.statusCode, 400);
        assert.equal(body.error, 'Bad Request');
        assert.equal(body.name, 'HttpStatusError');
        return null;
      })
    ));

    it('should return an error if missing token', () => (
      request(uri.unsubscribe, {
        id: this.firstEventId,
      }).then(({ body, statusCode }) => {
        assert.ok(/data should have required property 'token'/.test(body.message), JSON.stringify(body));
        assert.equal(statusCode, 400);
        assert.equal(body.statusCode, 400);
        assert.equal(body.error, 'Bad Request');
        assert.equal(body.name, 'HttpStatusError');
        return null;
      })
    ));

    it('should return an error if wrong authentication', () => (
      request(uri.unsubscribe, {
        token: 'asdrt454rwefadqwfsfdgvse.wqeqwe23weg6t34rasdad.32ewqdafsdffawd3afas',
        id: this.firstEventId,
      }).then(({ body, statusCode }) => {
        assert.equal(statusCode, 401);
        assert.equal(body.statusCode, 401);
        assert.equal(body.error, 'Unauthorized');
        assert.equal(body.name, 'AuthenticationRequiredError');
        return null;
      })
    ));

    it('should return an error if event does not exist', () => (
      request(uri.unsubscribe, {
        token: this.firstUserToken,
        id: 1000,
      }).then(({ body, statusCode }) => {
        assert.ok(/user is not subscribed to this event/.test(body.message), JSON.stringify(body));
        assert.equal(statusCode, 403);
        assert.equal(body.statusCode, 403);
        assert.equal(body.error, 'Forbidden');
        assert.equal(body.name, 'NotPermittedError');
        return null;
      })
    ));

    it('should be to unsubscribe successfully', () => (
      request(uri.unsubscribe, {
        token: this.firstUserToken,
        id: this.firstEventId,
      }).then(({ body, statusCode }) => {
        assert.equal(statusCode, 200);
        assert.equal(body, this.firstEventId);
        return null;
      })
    ));
  });
});
