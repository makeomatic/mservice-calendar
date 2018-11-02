/*
 * calendar.js
 * @flow
 */
const merge = require('lodash/merge');
const { globFiles } = require('ms-conf/lib/load-config');
const { Microfleet, ConnectorsTypes } = require('@microfleet/core');
const path = require('path');

const StorageService = require('./services/storage');
const EventService = require('./services/event');
const UserService = require('./services/user');

const defaultConfig = globFiles(path.resolve(__dirname, 'configs'));

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

  connect() {
    return super
      .connect()
      .bind(this)
      .then(this.initServices);
  }

  initServices() {
    this.services.storage = new StorageService(this.knex, this.log);
    this.services.event = new EventService(this.services.storage);

    this.log.info('Started Calendar service...');
  }
}

module.exports = Calendar;
