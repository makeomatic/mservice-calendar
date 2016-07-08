#!/usr/bin/env node

// accepts conf through .env file
// suitable for configuring this in the docker env
const configuration = require('ms-conf');
const Service = require('../src');
const service = new Service(configuration.get('/'));

service.connect()
    .then(function testPrepare() {
        if (process.env.NODE_ENV === 'test') {
            service.log.info('Started service, dropping tables');
            return service.cleanup();
        } else {
            return true;
        }
    })
    .then(function prepareService() {
        service.log.info('Started service, initiating tables');
        return service.migrate();
    })
    .then(function serviceUp() {
        service.log.info('Created tables');
    })
    .catch(function serviceCrashed(err) {
        service.log.fatal('Failed to start service', err);
        setImmediate(() => {
            throw err;
        });
    });
