#!/usr/bin/env node

/* eslint-disable no-console, no-await-in-loop, no-continue */
// accepts conf through .env file
// suitable for configuring this in the docker env
const AMQPTransport = require('@microfleet/transport-amqp');
const omit = require('lodash/omit');
const Knex = require('knex');
const config = require('ms-conf').get('/', { env: process.env.NODE_ENV });
const { argv } = require('yargs');
const { EVENT_TABLE } = require('../lib/constants');
const Storage = require('../lib/services/storage');
const Event = require('../lib/services/event');

const amqpConfig = omit(config.amqp.transport, ['queue', 'neck', 'listen', 'onComplete']);
const knex = Knex(config.knex);

(async () => {
  const amqp = await AMQPTransport.connect(amqpConfig);
  const getMetadata = `${config.users.prefix}.${config.users.postfix.getMetadata}`;
  const { audience } = config.users;

  const storage = new Storage(knex, console);
  const events = new Event(storage);

  try {
    const rows = await knex.select(['id', 'owner', 'rrule', 'duration']).from(EVENT_TABLE).whereNull('tz');
    console.info('Found %d rows', rows.length);

    // update events
    for (const event of rows) {
      const { stationTimezone } = await amqp
        .publishAndWait(getMetadata, { username: event.owner, audience }, { cache: 30000 })
        .get(audience);

      if (stationTimezone == null) {
        console.info('%s has no stationTimezone', event.owner);
        continue;
      }

      if (argv.dryRun) {
        console.info('set %s for %j', stationTimezone, event);
        continue;
      }

      // updates event
      await events.update(event.id, event.owner, {
        rrule: event.rrule,
        duration: event.duration,
        tz: stationTimezone,
      });
    }
  } finally {
    await amqp.close();
    await knex.destroy();
  }
})();
