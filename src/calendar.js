const _ = require('lodash');
const { globFiles } = require('ms-conf/lib/load-config');
const MService = require('mservice');
const path = require('path');

const StorageService = require('./services/storage');
const EventService = require('./services/event');
const UserService = require('./services/user');

const defaultConfig = globFiles(path.resolve(__dirname, 'configs'));

class Calendar extends MService {
  /**
   * @param config
   */
  constructor(config = {}) {
    super(_.merge({}, defaultConfig, config));
    this.addConnector(MService.ConnectorsTypes.migration, () => this.migrate('knex'));
    this.services = {};
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
