const RRule = require('rrule').RRule;
const _ = require('lodash');

module.exports = function postSingle(data) {
  const rule = RRule.fromString(data.rrule);

  _.extend(data, {
    start_time: _.take(rule.all(), 3),
  });
};
