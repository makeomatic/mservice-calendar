const Promise = require('bluebird');
const moment = require('moment');

const Calendar = require('./index');
const service = new Calendar({namespace: 'test_calendar'});

const createHeaders = {routingKey: 'calendar.events.create'};
const listHeaders = {routingKey: 'calendar.events.list'};
/*
Promise.coroutine.addYieldHandler(function arrayHandler(value) {
    if (Array.isArray(value)) return Promise.all(value.map(function (item) {
        return Promise.resolve(item);
    }));
});

const create = [
    service.router({
        id: 1,
        title: 'Test event 1',
        description: 'One time event',
        recurring: false,
        start_time: moment().valueOf(),
        end_time: moment().valueOf()
    }, createHeaders).catch((e) => console.error(e)),
    service.router({
        id: 2,
        title: 'Test event 2',
        description: 'Recurring event',
        recurring: true,
        rrule: 'FREQ=WEEKLY;COUNT=30;WKST=MO;BYDAY=TU',
        start_time: moment().valueOf(),
        end_time: moment().valueOf()
    }, createHeaders).catch((e) => console.error(e))
];

const list = service.router({
    where: {
        recurring: true
    }
}, listHeaders).catch((e) => console.error(e));

const result = Promise.coroutine(function*() {
    yield create;
    console.log('Result:', yield list);
});

Promise.bind(service)
    .then(service.migrate)
    .then(result)
    .then(service.cleanup)
    .catch((e) => {
        console.error(e);
    });
*/

service.router({
    where: {
    }
}, listHeaders)
.then(result => console.log(result))
.catch(e => console.error(e))