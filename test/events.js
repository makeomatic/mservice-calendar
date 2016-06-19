const Promise = require('bluebird');
const assert = require('assert');
const moment = require('moment-timezone');
const { debug } = require('../utils');

describe('Events Suite', function EventsSuite() {
    const Calendar = require('../index');
    const service = new Calendar({ namespace: 'test_calendar' });

    const createHeaders = {routingKey: 'calendar.events.create'};
    
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
        });
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
        });
    });

    describe('Update', function EventUpdateSuite() {
        it('Successful update');
        it('Fail on invalid schema');
        it('Fail for non-existent id');
    });

    describe('List', function EventListSuite() {
        it('Return single record');
        it('Return empty list for non-matching query');
        it('Return list');
        it('Fail to return single record for non-existent id');
        it('Fail to return list on invalid query');
    });

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
});