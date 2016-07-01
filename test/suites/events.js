const Promise = require('bluebird');
const assert = require('assert');
const moment = require('moment-timezone');
const omit = require('lodash/omit');
const assign = require('lodash/assign');
const {debug} = require('../helpers/utils');

describe('Events Suite', function EventsSuite() {
    const Calendar = require('../../src');
    const host = process.env.CRATE_HOST || '127.0.0.1';
    const connectionString = `http://${host}:4200`;
    const service = new Calendar({
        crate: {
            namespace: 'test_calendar',
            connectionString
        }
    });

    const createHeaders = {routingKey: 'calendar.events.create'};
    const updateHeaders = {routingKey: 'calendar.events.update'};
    const deleteHeaders = {routingKey: 'calendar.events.remove'};
    const listHeaders = {routingKey: 'calendar.events.list'};
    const singleHeaders = {routingKey: 'calendar.events.single'};
    const subscribeHeaders = {routingKey: 'calendar.events.subscribe'};
    const calendarHeaders = {routingKey: 'calendar.events.calendar'};

    const event1 = {
        id: 'event1',
        owner: 'test@test.ru',
        title: 'Test event 1',
        description: 'One time event',
        recurring: false,
        start_time: moment('2016-09-26').valueOf(),
        end_time: moment('2016-09-27').valueOf(),
        timezone: 'Asia/Irkutsk'
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
        timezone: 'Asia/Irkutsk'
    };

    before('Migrate table', () => {
        return service.migrate();
    });

    after('Cleanup table', () => {
        return service.cleanup();
    });

    describe('Create', function EventCreateSuite() {
        it('Success one-time event', () => {
            return service.router(event1, createHeaders)
                .reflect()
                .then(result => {
                    debug(result);
                    assert(result.isFulfilled());
                });
        });
        it('Success recurring event', () => {
            return service.router(event2, createHeaders)
                .reflect()
                .then(result => {
                    debug(result);
                    assert(result.isFulfilled());
                });
        });

        it('Fail with existing id', () => {
            return service.router(event1, createHeaders)
                .reflect()
                .then(result => {
                    assert(result.isRejected());
                });
        });
        it('Fail without id', () => {
            return service.router(omit(event1, 'id'), createHeaders)
                .reflect()
                .then(result => {
                    assert(result.isRejected());
                });
        });
        it('Fail with missing rrule for recurring events', () => {
            return service.router(assign(omit(event2, 'rrule'), {
                id: 'event2_no_rrule',
            }), createHeaders)
                .reflect()
                .then(result => {
                    assert(result.isRejected());
                });
        });
        it('Fail with invalid rrule for recurring events', () => {
            return service.router(assign({}, event2, {
                id: 'event2_invalid_rrule',
                rrule: 'invalid',
            }), createHeaders)
                .reflect()
                .then(result => {
                    assert(result.isRejected());
                });
        });
        it('Fail on invalid schema', () => {
            return service.router({
                id: 'invalid',
                invalid: true,
            }, createHeaders)
                .reflect()
                .then(result => {
                    assert(result.isRejected());
                });
        });
    });

    describe('Update', function EventUpdateSuite() {
        it('Successful update', () => {
            return service.router({
                id: event1.id,
                description: 'Updated description'
            }, updateHeaders)
                .reflect()
                .then(result => {
                    debug(result);
                    assert(result.isFulfilled());
                    assert.equal(result.value().instance.description, 'Updated description');
                });
        });
        it('Add subscribers', () => {
            return service.router({
                event: event1.id,
                subscriber: 'Vasya',
                notify: true
            }, subscribeHeaders)
                .reflect()
                .then(result => {
                    debug(result);
                    assert(result.isFulfilled());
                    const instance = result.value();
                    assert.notEqual(instance.subscribers.indexOf('Vasya'), -1);
                    assert.notEqual(instance.notifications.indexOf('Vasya'), -1);
                });
        });
        it('Fail on invalid schema', () => {
            return service.router({
                id: event1.id,
                description: 'Updated description',
                wrong: 'field'
            }, updateHeaders)
                .reflect()
                .then(result => {
                    assert(result.isRejected());
                });
        });
        it('Fail on missing id', () => {
            return service.router({
                description: 'Updated description'
            }, updateHeaders)
                .reflect()
                .then(result => {
                    assert(result.isRejected());
                });
        });
        it('Fail for non-existent id', () => {
            return service.router({
                id: 'invalid',
                description: 'Updated description'
            }, updateHeaders)
                .reflect()
                .then(result => {
                    assert(result.isRejected());
                });
        });
    });

    describe('List', function EventListSuite() {
        this.timeout(10000);
        before(() => Promise.delay(1000));
        it('Return single record', () => {
            return service.router({
                id: event1.id
            }, singleHeaders)
                .reflect()
                .then(result => {
                    debug(result);
                    assert(result.isFulfilled());
                    const instance = result.value();
                    assert.notEqual(instance.subscribers.indexOf('Vasya'), -1);
                    assert.notEqual(instance.notifications.indexOf('Vasya'), -1);
                    assert.equal(instance.title, 'Test event 1');
                });
        });
        it('Return empty list for non-matching query', () => {
            return service.router({
                where: {
                    title: 'Nothing'
                }
            }, listHeaders)
                .reflect()
                .then(result => {
                    debug(result);
                    assert(result.isFulfilled());
                    assert.equal(result.value().length, 0);
                });
        });
        it('Return list', () => {
            return service.router({
                where: {
                    recurring: true
                }
            }, listHeaders)
                .reflect()
                .then(result => {
                    debug(result);
                    assert(result.isFulfilled());
                    assert.notEqual(result.value().length, 0);
                });
        });
        it('Fail to return single record for non-existent id', () => {
            return service.router({
                id: 'invalid'
            }, singleHeaders)
                .reflect()
                .then(result => {
                    assert(result.isRejected());
                });
        });
        it('Fail to return list on invalid query', () => {
            return service.router({
                invalid: true
            }, listHeaders)
                .reflect()
                .then(result => {
                    assert(result.isRejected());
                });
        });
    });

    describe('Calendar', function CalendarSuite() {
        it('Return calendar for date range', () => {
            return service.router({
                start: moment('2016-08-01').valueOf(),
                end: moment('2016-10-01').valueOf()
            }, calendarHeaders)
                .reflect()
                .then(result => {
                    debug(result);
                    assert(result.isFulfilled());
                });
        });
    });

    describe('Delete', function EventDeleteSuite() {
        it('Delete single record', () => {
            return service.router({
                id: event1.id,
            }, deleteHeaders)
                .reflect()
                .then(result => {
                    debug(result);
                    assert(result.isFulfilled());
                });
        });
        it('Delete nothing on non-matching query', () => {
            return service.router({
                where: {
                    id: ['>', 100],
                },
            }, deleteHeaders)
                .reflect()
                .then(result => {
                    debug(result);
                    assert(result.isFulfilled());
                });
        });
        it('Delete by query', () => {
            return service.router({
                where: {
                    id: ['like', '%event%'],
                },
            }, deleteHeaders)
                .reflect()
                .then(result => {
                    debug(result);
                    assert(result.isFulfilled());
                });
        });
        it('Fail to delete on invalid query', () => {
            return service.router({
                invalid: {
                    id: 'invalid',
                },
            }, deleteHeaders)
                .reflect()
                .then(result => {
                    assert(result.isRejected());
                });
        });
    });
});
