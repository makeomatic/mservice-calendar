const RRule = require('rrule').RRule;
const moment = require('moment');
const _ = require('lodash');

module.exports = function postSingle(data) {
  const rule = RRule.fromString(data.rrule);
  const dates = rule.between(moment.utc().toDate(), rule.options.until);

  _.extend(data, {
    start_time: _.take(dates, 3),
  });
};
