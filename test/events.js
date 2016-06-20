const Promise = require('bluebird');
const assert = require('assert');
const moment = require('moment-timezone');
const { debug } = require('../utils');

describe('Events Suite', function EventsSuite() {
    const Calendar = require('../index');
    const service = new Calendar({ namespace: 'test_calendar' });

    const createHeaders = {routingKey: 'calendar.events.create'};
    const updateHeaders = {routingKey: 'calendar.events.update'};
    const deleteHeaders = {routingKey: 'calendar.events.remove'};
    const listHeaders   = {routingKey: 'calendar.events.list'};
    const singleHeaders = {routingKey: 'calendar.events.single'};

    before('Migrate table', () => {
        return service.migrate();
    });

    after('Cleanup table', () => {
        return service.cleanup();
    });
    
    describe('Create', function EventCreateSuite() {
        it('Success one-time event', () => {
            return service.router({
                id: 1,
                title: 'Test event 1',
                description: 'One time event',
                recurring: false,
                start_time: moment().valueOf(),
                end_time: moment().valueOf()
            }, createHeaders)
                .reflect()
                .then(result => {
                    assert(result.isFulfilled());
                });
        });
        it('Success recurring event', () => {
            return service.router({
                id: 2,
                title: 'Test event 2',
                description: 'Recurring event',
                recurring: true,
                rrule: 'FREQ=WEEKLY;COUNT=30;WKST=MO;BYDAY=TU',
                start_time: moment().valueOf(),
                end_time: moment().valueOf()
            }, createHeaders)
                .reflect()
                .then(result => {
                    assert(result.isFulfilled());
                });
        });/*
        it('Fail with existing id', () => {
            return service.router({
                id: 2,
                title: 'Test event 2',
                description: 'Recurring event',
                recurring: true,
                rrule: 'FREQ=WEEKLY;COUNT=30;WKST=MO;BYDAY=TU',
                start_time: moment().valueOf(),
                end_time: moment().valueOf()
            }, createHeaders)
                .reflect()
                .then(result => {
                    assert(result.isRejected());
                });
        });
        it('Fail without id', () => {
            return service.router({
                title: 'Test event 2',
                description: 'Recurring event',
                recurring: true,
                rrule: 'FREQ=WEEKLY;COUNT=30;WKST=MO;BYDAY=TU',
                start_time: moment().valueOf(),
                end_time: moment().valueOf()
            }, createHeaders)
                .reflect()
                .then(result => {
                    assert(result.isRejected());
                });
        });
        it('Fail with missing rrule for recurring events', () => {
            return service.router({
                id: 3,
                title: 'Test event 3',
                description: 'Recurring event',
                recurring: true,
                start_time: moment().valueOf(),
                end_time: moment().valueOf()
            }, createHeaders)
                .reflect()
                .then(result => {
                    assert(result.isRejected());
                });
        });
        it('Fail with invalid rrule for recurring events', () => {
            return service.router({
                id: 4,
                title: 'Test event 4',
                description: 'Recurring event',
                recurring: true,
                rrule: 'invalid rrule',
                start_time: moment().valueOf(),
                end_time: moment().valueOf()
            }, createHeaders)
                .reflect()
                .then(result => {
                    assert(result.isRejected());
                });
        });
        it('Fail on invalid schema', () => {
            return service.router({
                id: 5,
                title: 'Test event 5',
                description: 'Invalid schema',
                invalid: true
            }, createHeaders)
                .reflect()
                .then(result => {
                    assert(result.isRejected());
                });
        });*/
    });

    describe('Update', function EventUpdateSuite() {
        it('Successful update', () => {
            return service.router({
                id: 1,
                description: 'Updated description'
            }, updateHeaders)
                .reflect()
                .then(result => {
                    debug(result);
                    assert(result.isFulfilled());
                    assert.equal(result.value().data.description, 'Updated description');
                });
        });
        it('Fail on invalid schema', () => {
            return service.router({
                id: 1,
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
                id: 10,
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
        before(() => {
            // wait for data to become available
            return Promise.delay(1000);
        });
        it('Return single record', () => {
            return service.router({
                id: 1
            }, singleHeaders)
                .reflect()
                .then(result => {
                    debug(result);
                    assert(result.isFulfilled());
                    assert.equal(result.value().data.title, 'Test event 1');
                });
        });
        it('Return empty list for non-matching query', () => {
            return service.router({
                where: {
                    title: "Nothing"
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
                id: 10
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

    /*
    describe('Delete', function EventDeleteSuite() {
        it('Delete single record');
        it('Delete nothing on non-matching query');
        it('Delete by query');
        it('Fail to delete single on invalid id');
        it('Fail to delete on invalid query');
    });

    describe('Hooks', function EventHooksSuite() {
        it('Pre-hook successfully called');
        it('Post-hook successfully called');
        it('Pre-hook removed');
        it('Post-hook removed');
        it('Invalid pre-hook ignored');
        it('Invalid post-hook ignored');
    });
    */
});