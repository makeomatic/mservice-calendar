const { map, reduce, concat } = require('lodash');
const moment = require('moment-timezone');
const RRule = require('rrule').RRule;
const Promise = require('bluebird');

class Calendar {
  constructor(events) {
    this.list = events.list.bind(events);
  }

  * build(data) {
    // select all events
    const events = yield Promise.coroutine(this.list)({ where: {} });

    // for each event build it's schedule
    const calendar = reduce(events, (acc, event) => {
      const start = moment(data.start);
      const end = moment(data.end);

      const startEvent = moment(event.start_time);
      const endEvent = moment(event.end_time);

      let duration;
      if (event.duration) {
        duration = moment.duration(event.duration);
      } else {
        duration = moment.duration(endEvent.diff(startEvent));
      }

      let schedule;
      if (event.recurring) {
        const rrule = RRule.fromString(event.rrule);

        // include time frame borders
        let rruleStart;
        let rruleEnd;

        if (start.isBefore(startEvent)) {
          rruleStart = startEvent.clone();
        } else {
          rruleStart = start.clone();
        }

        if (end.isAfter(endEvent)) {
          rruleEnd = endEvent.clone();
        } else {
          rruleEnd = end.clone();
        }

        schedule = rrule.between(rruleStart.toDate(), rruleEnd.toDate(), true);

        // convert schedules to desired format: append start and end for every event
        schedule = map(schedule, (entry) => {
          const time = moment(entry);
          const startEntry = time
            .clone()
            .hours(startEvent.hours())
            .minutes(startEvent.minutes())
            .seconds(0);
          const endEntry = startEntry
            .clone()
            .add(duration)
            .seconds(0);

          return [startEntry.valueOf(), endEntry.valueOf()];
        });

        // only include event if it happens inside desired time frame
      } else if (startEvent.isAfter(start) && endEvent.isBefore(end)) {
        schedule = [[startEvent.valueOf(), endEvent.valueOf()]];
      } else {
        schedule = null;
      }

      if (schedule != null) {
        const result = {
          id: event.id,
          title: event.title,
          schedule,
        };

        return concat(acc, result);
      }

      return acc;
    }, []);

    return yield Promise.resolve(calendar);
  }
}

module.exports = Calendar;
