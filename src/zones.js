/* eslint-disable class-methods-use-this */
// 'Eastern Time (GMT-5)': 'US/Eastern'
// 'Central Time (GMT-6)': 'US/Central'
// 'Mountain Time (GMT-7)': 'US/Mountain'
// 'Mountain Time - AZ (GMT-7)': 'US/Arizona',
// 'Pacific Time (GMT-8)': 'US/Pacific',
// 'Alaska Time (GMT-9)': 'US/Alaska',
// 'Hawaii Time (GMT-10)': 'US/Hawaii',

const luxon = require('luxon');
const moment = require('moment-timezone');

class MomentTimezone extends luxon.Zone {
  constructor(name) {
    super();
    this.zoneName = name;
    this.zone = moment.tz.zone(name);
  }

  // compatability method
  toUpperCase() {
    return this;
  }

  /**
   * The type of zone
   * @abstract
   * @type {string}
   */
  get type() {
    return 'moment';
  }

  /**
   * The name of this zone.
   * @abstract
   * @type {string}
   */
  get name() {
    return this.zone.name;
  }

  /**
   * Returns whether the offset is known to be fixed for the whole year.
   * @abstract
   * @type {boolean}
   */
  get universal() {
    return this.zone.offsets.length === 1;
  }

  /**
   * Returns the offset's common name (such as EST) at the specified timestamp
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to get the name
   * @return {string}
   */
  offsetName(ts) {
    return this.zone.abbr(ts);
  }

  /**
   * Return the offset in minutes for this zone at the specified timestamp.
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to compute the offset
   * @return {number}
   */
  offset(ts) {
    // expects to get them in the reverse
    return -this.zone.utcOffset(ts);
  }

  /**
   * Return whether this Zone is equal to another zoner
   * @abstract
   * @param {Zone} otherZone - the zone to compare
   * @return {boolean}
   */
  equals(otherZone) {
    return this.zone.name === otherZone.name;
  }

  /**
   * Return whether this Zone is valid.
   * @abstract
   * @type {boolean}
   */
  get isValid() {
    return this.zone !== null;
  }
}

exports.MomentTimezone = MomentTimezone;
exports.zones = {
  'US/Eastern': new MomentTimezone('US/Eastern'),
  'US/Central': new MomentTimezone('US/Central'),
  'US/Mountain': new MomentTimezone('US/Mountain'),
  'US/Arizona': new MomentTimezone('US/Arizona'),
  'US/Pacific': new MomentTimezone('US/Pacific'),
  'US/Alaska': new MomentTimezone('US/Alaska'),
  'US/Hawaii': new MomentTimezone('US/Hawaii'),
};
