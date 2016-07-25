#!/usr/bin/env node

// accepts conf through .env file
// suitable for configuring this in the docker env
const configuration = require('ms-conf');
const Service = require('../src');
const service = new Service(configuration.get('/'));
const Promise = require('bluebird');
const url = require('url');

const ping = Promise.promisify(require('./ping').ping);

service.connect()
    .then(function awaitCrate() {
        const crateServer = url.parse(configuration.get('/').crate.connectionString);
        return ping({
            address: crateServer.hostname,
            port: crateServer.port,
            timeout: 10000,
            attempts: 20
        }).then(function parsePing(pingResult) {
            const err = pingResult.results[pingResult.results.length - 1].err;
            if (err) {
                throw new Error(`Could not connect to Crate.io server ${crateServer.host}`);
            }
        })
    })
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
