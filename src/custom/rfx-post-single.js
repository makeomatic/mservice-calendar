const moment = require('moment');
const extend = require('lodash/extend');
const take = require('lodash/take');
const Event = require('../services/event');

module.exports = function postSingle(data) {
  const rule = Event.parseRRule(data).parsedRRule;
  const dates = rule.between(moment.utc().toDate(), rule.options.until);

  extend(data, {
    start_time: take(dates, 3),
  });
};
