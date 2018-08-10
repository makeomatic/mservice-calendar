const RRule = require('rrule').RRule;
const _ = require('lodash');

module.exports = function postSingle(data) {
  const { dtstart } = RRule.parseString(data.rrule);

  _.extend(data, {
    start_time: dtstart,
  });
};
