const Promise = require('bluebird');
const assert = require('assert');
const moment = require('moment-timezone');
const { debug } = require('../utils');

describe('Events Suite', function EventsSuite() {
    const Calendar = require('../index');
    const service = new Calendar();

    const createHeaders = {routingKey: 'calendar.events.create'};
    
    describe('Create', function EventCreateSuite() {
        it('Success one-time event', () => {
            return service.router({
                id: 1,
                title: 'Test event',
                description: 'One time event',
                recurring: false,
                start_time: moment().valueOf(),
                end_time: moment().valueOf()
            }, createHeaders)
                .reflect()
                .then(result => {
                    debug(result);
                    assert(result.isFulfilled());
                });
        });
        it('Success recurring event');
        it('Fail with existing id');
        it('Fail without id');
        it('Fail on invalid schema', () => {
            return service.router({}, createHeaders)
                .reflect()
                .then(result => {
                    debug(result);
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
    });
});