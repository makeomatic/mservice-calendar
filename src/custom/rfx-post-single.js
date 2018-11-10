const { RRule } = require('rrule');
const moment = require('moment');
const extend = require('lodash/extend');
const take = require('lodash/take');

module.exports = function postSingle(data) {
  const rule = RRule.fromString(data.rrule);
  const dates = rule.between(moment.utc().toDate(), rule.options.until);

  extend(data, {
    start_time: take(dates, 3),
  });
};
