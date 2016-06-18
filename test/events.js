const Promise = require('bluebird');
const assert = require('assert');

describe('Events Suite', function EventsSuite() {
    const Calendar = require('../index');

    describe('Create', function EventCreateSuite() {
        it('Fail on invalid schema');
        it('Fail with existing id');
        it('Fail without id');
        it('Success one-time event');
        it('Success recurring event');
    });

    describe('Update', function EventUpdateSuite() {
        it('Fail on invalid schema');
        it('Fail for non-existent id');
        it('Successful update');
    });

    describe('List', function EventListSuite() {
        it('Fail to return single record for non-existent id');
        it('Fail to return list on invalid query');
        it('Return single record');
        it('Return empty list for non-matching query');
        it('Return list');
    })

    describe('Delete', function EventDeleteSuite() {
        it('Fail to delete single on invalid id');
        it('Fail to delete on invalid query');
        it('Delete single record');
        it('Delete nothing on non-matching query');
        it('Delete by query');
    });
});