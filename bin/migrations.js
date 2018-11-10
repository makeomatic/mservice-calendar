#!/usr/bin/env node

const assert = require('assert');
const Service = require('../lib');

const service = new Service();
const { knex } = service;
const name = process.argv[2];

assert(name, 'Migration name must be specified');

// eslint-disable-next-line promise/catch-or-return
knex.migrate.make(name).then((info) => {
  service.log.info('Create migration:', info);
  return process.exit();
});
