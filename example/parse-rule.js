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
  rrule: 'DTSTART=20180206T050000Z;UNTIL=20190205T050000Z;WKST=SU;FREQ=DAILY;COUNT=3',
  duration: 1440,
  tz: 'US/Eastern',
});

const sunday = Event.parseRRule({
  rrule: 'DTSTART=20180930T030000Z;UNTIL=20190422T120000Z;WKST=SU;FREQ=WEEKLY;BYDAY=SU;COUNT=1',
  duration: 540,
  tz: 'US/Eastern',
});

const central = Event.parseRRule({
  rrule: 'DTSTART=20180825T170000Z;UNTIL=20190101T050000Z;WKST=SU;FREQ=WEEKLY;BYDAY=SA',
  duration: 720,
  tz: 'US/Central',
});

const MO = Event.parseRRule({
  rrule: 'DTSTART=20181105T080000Z;UNTIL=20191102T100000Z;WKST=SU;FREQ=WEEKLY;BYDAY=MO;COUNT=1',
  duration: 120,
  tz: 'US/Pacific',
});

const SU = Event.parseRRule({
  rrule: 'DTSTART=20181111T070000Z;UNTIL=20191103T100000Z;WKST=SU;FREQ=WEEKLY;BYDAY=SU;COUNT=1',
  duration: 180,
  tz: 'US/Pacific',
});

// console.info(generateSpans(1, data));
// console.info(generateSpans(2, tzRule));
// console.info(generateSpans(3, allDay));
// console.info(generateSpans(4, sunday));
// console.info(generateSpans(5, central));
// console.info(generateSpans(6, MO));
// console.info(generateSpans(7, SU));
console.info(generateSpans(8, Event.parseRRule({
  rrule: 'DTSTART=20180324T060000Z;UNTIL=20190102T120000Z;WKST=SU;FREQ=WEEKLY;BYDAY=SA',
  duration: 360,
  tz: 'US/Pacific',
})))
