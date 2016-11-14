const _ = require('lodash');
const { globFiles } = require('ms-conf/lib/load-config');
const MService = require('mservice');
const path = require('path');

const StorageService = require('./services/storage');
const EventService = require('./services/event');
const CalendarService = require('./services/calendar');

const defaultConfig = globFiles(path.resolve(__dirname, 'configs'));
const Promise = require('bluebird');

class Calendar extends MService {
  /**
   * @param config
   */
  constructor(config = {}) {
    super(_.merge({}, defaultConfig, config));
    this.addConnector(MService.ConnectorsTypes.migration, () => this.migrate('knex'));
    this.initServices = Promise.coroutine(this.initServices);
  }

  connect() {
    return super
      .connect()
      .bind(this)
      .then(this.initServices);
  }

  * initServices() {
    if (this.config.storage.delay) {
      this.log.info(`Delaying Calendar service launch by ${this.config.storage.delay} ms`);
      yield Promise.delay(this.config.storage.delay);
    }

    const storage = new StorageService(this.knex);
    const event = new EventService(storage);
    const calendar = new CalendarService(event);

    this.services = {
      storage,
      event,
      calendar,
    };

    this.log.info('Started Calendar service...');
  }
}

module.exports = Calendar;
