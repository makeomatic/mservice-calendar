#!/usr/bin/env node

/* eslint-disable no-console, no-await-in-loop, no-continue */
// accepts conf through .env file
// suitable for configuring this in the docker env
const AMQPTransport = require('@microfleet/transport-amqp');
const omit = require('lodash/omit');
const Knex = require('knex');
const config = require('../lib/config').get('/', { env: process.env.NODE_ENV });
const { EVENT_TABLE, EVENT_SPANS_TABLE } = require('../lib/constants');
const Storage = require('../lib/services/storage');
const Event = require('../lib/services/event');

const amqpConfig = omit(config.amqp.transport, ['queue', 'neck', 'listen', 'onComplete']);
const knex = Knex(config.knex);

(async () => {
  const { argv } = require('yargs')
    .option('ver', {
      type: 'number',
      default: config.eventVersion,
      required: true,
    })
    .option('dryRun', {
      type: 'boolean',
      default: false,
    })
    .option('dropIndex', {
      type: 'boolean',
      default: false,
    });

  const printedWarnings = {};
  const amqp = await AMQPTransport.connect(amqpConfig);
  const getMetadata = `${config.users.prefix}.${config.users.postfix.getMetadata}`;
  const { audience } = config.users;

  const storage = new Storage(knex, console, config.eventVersion);
  const events = new Event(storage);

  try {
    const rows = await knex.select(['id', 'owner', 'rrule', 'duration'])
      .from(EVENT_TABLE)
      .where('version', '<', argv.ver);

    console.info('Found %d rows, config: %j', rows.length, argv);

    if (argv.dropIndex) {
      await knex.raw(
        `ALTER TABLE ${EVENT_SPANS_TABLE} DROP CONSTRAINT owner_period_not_overlaps`
      );
    }

    // update events
    for (const event of rows) {
      const { stationTimezone } = await amqp
        .publishAndWait(getMetadata, { username: event.owner, audience }, { cache: 30000 })
        .get(audience);

      if (stationTimezone == null) {
        if (!printedWarnings[event.owner]) {
          console.info('%s has no stationTimezone', event.owner);
          printedWarnings[event.owner] = true;
        }
        continue;
      }

      if (argv.dryRun) {
        console.info('set %s for %j', stationTimezone, event);
        continue;
      }

      // updates event
      const failed = await events
        .update(event.id, event.owner, {
          rrule: event.rrule,
          duration: event.duration,
          tz: stationTimezone,
        })
        .catchReturn({ message: 'Invalid RRule: DTSTART must be before UNTIL' }, null)
        .catchReturn({ message: 'Invalid RRule: DTSTART must be without the last year' }, null)
        .catch(e => console.error('%j', event, e.message));

      if (failed === null) console.warn('>> %j', event);
    }
  } finally {
    await amqp.close();

    if (argv.dropIndex) {
      await knex.raw(
        `ALTER TABLE ${EVENT_SPANS_TABLE} ADD CONSTRAINT owner_period_not_overlaps`
        + ' EXCLUDE USING gist (owner WITH =, period WITH &&)'
      );
    }

    await knex.destroy();
  }
})();
