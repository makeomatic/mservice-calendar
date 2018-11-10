const Event = require('../src/services/event');
const { generateSpans } = require('../src/services/storage');

const rrule = 'DTSTART=20181029T120000Z;UNTIL=20181101T140000Z;WKST=SU;FREQ=WEEKLY;BYDAY=MO';
const data = Event.parseRRule({
  rrule,
  duration: 120,
});

const tzRule = Event.parseRRule({
  rrule,
  duration: 120,
  tz: 'US/Eastern',
});

const allDay = Event.parseRRule({
  rrule: 'DTSTART=20180206T050000Z;UNTIL=20190205T050000Z;WKST=SU;FREQ=DAILY',
  duration: 1440,
  tz: 'US/Eastern',
});

console.info(generateSpans(1, data));
console.info(generateSpans(2, tzRule));
console.info(generateSpans(3, allDay));
