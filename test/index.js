const Promise = require('bluebird');
const assert = require('assert');

describe('Functionality suite', function FunctionalitySuite() {
    const Calendar = require('../index');
    const host = process.env['CRATE_HOST'] || '127.0.0.1';
    const connectionString = `http://${host}:4200`;
    const service = new Calendar({crate: {namespace: 'test_calendar', connectionString: connectionString}});

    it('Should fail on invalid route', () => {
        return service.router({}, { routingKey: 'files.test.test' })
            .reflect()
            .then(result => {
                assert(result.isRejected());
            });
    });

    it('Should fail on invalid routing schema', () => {
        return service.router({}, { invalid: true })
            .reflect()
            .then(result => {
                assert(result.isRejected());
            });
    });

    it('Should fail on invalid controller', () => {
        return service.router({}, { routingKey: 'calendar.invalid.test' })
            .reflect()
            .then(result => {
                assert(result.isRejected());
            });
    });

    it('Should fail on invalid action', () => {
        return service.router({}, { routingKey: 'calendar.events.invalid' })
            .reflect()
            .then(result => {
                assert(result.isRejected());
            });
    });
});