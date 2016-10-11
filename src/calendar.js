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

    const init = Promise.coroutine(function* initServices() {
      const storage = new StorageService(this.config.storage);
      const event = new EventService(storage);
      const calendar = new CalendarService(event);

      // sequentially initialize services
      yield storage.init();

      this.services = {
        storage,
        event,
        calendar,
      };

      this.log.info('Started Calendar service...');
    }).bind(this);

    init();
  }
}

module.exports = Calendar;
