/*
 * calendar.js
 * @flow
 */
const merge = require('lodash/merge');
const { Microfleet, ConnectorsTypes } = require('@microfleet/core');

const conf = require('./config');
const StorageService = require('./services/storage');
const EventService = require('./services/event');
const UserService = require('./services/user');

const defaultConfig = conf.get('/', { env: process.env.NODE_ENV });

class Calendar extends Microfleet {
  /**
   * @param config
   */
  constructor(config: ?Object = {}) {
    super(merge({}, defaultConfig, config));

    this.addConnector(ConnectorsTypes.migration, () => this.migrate('knex'));
    this.services = Object.create(null);
    this.on('plugin:connect:amqp', (amqp) => {
      this.services.user = new UserService(this.config.users, amqp);
    });
  }

  async connect() {
    await super.connect();
    await this.initServices();
  }

  initServices() {
    this.services.storage = new StorageService(this.knex, this.log);
    this.services.event = new EventService(this.services.storage);

    this.log.info('Started Calendar service...');
  }
}

module.exports = Calendar;
