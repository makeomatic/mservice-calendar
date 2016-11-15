#!/usr/bin/env node

// accepts conf through .env file
// suitable for configuring this in the docker env
const configuration = require('ms-conf');
const Calendar = require('../src');

const calendar = new Calendar(configuration.get('/'));

calendar
  .connect()
  .catch((err) => {
    calendar.log.fatal('Failed to start service', err);
    setImmediate(() => {
      throw err;
    });
  });
