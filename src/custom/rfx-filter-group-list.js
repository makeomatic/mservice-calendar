const uniq = require('lodash/uniq');
const remove = require('lodash/remove');
const findIndex = require('lodash/findIndex');

function filterUsers(users, stationGroup) {
  return users.filter(user => user.stationGroup === stationGroup);
}

function filterOwners(owners) {
  const [userService, params] = this;
  const { meta } = params;
  if (meta && meta.stationGroup) {
    return filterUsers(owners, meta.stationGroup);
  } else if (meta && meta.userId) {
    return userService
      .getById(meta.userId, ['stationGroup'], true)
      .get('stationGroup')
      .then(stationGroup => filterUsers(owners, stationGroup));
  }
  return owners;
}

function filterEvents(owners) {
  const events = this;
  remove(events, event => findIndex(owners, { username: event.owner }) === -1);
  return events;
}

module.exports = function filterGroup(events, params) {
  const { meta } = params;
  if (meta && (meta.stationGroup || meta.userId)) {
    const userService = this.services.user;
    const owners = uniq(events.map(event => event.owner));
    return userService
      .getById(owners, ['username', 'stationGroup'], true)
      // Filter owners by group
      .bind([userService, params])
      .then(filterOwners)
      // filter events
      .bind(events)
      .then(filterEvents);
  }
  return events;
};
