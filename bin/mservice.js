#!/usr/bin/env node

// accepts conf through .env file
// suitable for configuring this in the docker env
const configuration = require('ms-conf');
const Promise = require('bluebird');
const url = require('url');
const ping = Promise.promisify(require('./ping').ping);
const Service = require('../lib');

const service = new Service(configuration.get('/'));

function awaitCrate() {
  const crateServer = url.parse(configuration.get('/').crate.connectionString);
  return ping({
    address: crateServer.hostname,
    port: crateServer.port,
    timeout: 5000,
    attempts: 20,
  })
  .then(function parsePing(pingResult) {
    if (!pingResult) {
      throw new Error(`Could not connect to Crate.io server ${crateServer.host}`);
    }

    return null;
  });
}

function testPrepare() {
  if (process.env.NODE_ENV === 'test') {
    service.log.info('Started service, dropping tables');
    return service.cleanup();
  }

  return true;
}

function prepareService() {
  service.log.info('Started service, initiating tables');
  return service.migrate();
}

function serviceUp() {
  service.log.info('Created tables');
}

function serviceCrashed(err) {
  service.log.fatal('Failed to start service', err);
  setImmediate(() => {
    throw err;
  });
}

awaitCrate()
  .bind(service)
  .then(testPrepare)
  .then(prepareService)
  .then(serviceUp)
  .then(service.connect)
  .catch(serviceCrashed);
