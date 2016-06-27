#!/usr/bin/env node

let dir;
try {
  require('babel-register');
  dir = '../src';
} catch (e) {
  dir = '../lib';
}

// accepts conf through .env file
// suitable for configuring this in the docker env
const configuration = require('ms-conf');
const Service = require(dir);
const service = new Service(configuration.get('/'));

service.connect()
  .catch(function serviceCrashed(err) {
    service.log.fatal('Failed to start service', err);
    setImmediate(() => { throw err; });
  });
