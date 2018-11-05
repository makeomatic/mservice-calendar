const conf = require('ms-conf');
const path = require('path');

conf.prependDefaultConfiguration(path.resolve(__dirname, './configs'));

process.env.NCONF_NAMESPACE = process.env.NCONF_NAMESPACE || 'MS_CALENDAR';

module.exports = conf;
