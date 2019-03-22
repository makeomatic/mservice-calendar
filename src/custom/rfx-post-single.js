const moment = require('moment');
const extend = require('lodash/extend');
const take = require('lodash/take');
const Event = require('../services/event');

module.exports = function postSingle(data) {
  const rule = Event.parseRRule(data).parsedRRule;
  const until = rule.options.until || moment.utc(rule.options.dtstart).add(1, 'week').toDate();
  const dates = rule.between(moment.utc().toDate(), until, true);

  extend(data, {
    start_time: take(dates, 3),
  });
};
