const uniq = require('lodash/uniq');
const remove = require('lodash/remove');
const findIndex = require('lodash/findIndex');
const is = require('is');
const get = require('lodash/get');

function filterUsers(users, stationGroup) {
  return users.filter((user) => {
    const userStationGroups = get(user, 'stationGroup', 'radiofx');

    return is.string(userStationGroups)
      && userStationGroups.split(',').includes(stationGroup);
  });
}

function filterOwners(owners) {
  const [userService, params] = this;
  const { meta } = params;
  if (meta && meta.stationGroup) {
    return filterUsers(owners, meta.stationGroup);
  }

  if (meta && meta.userId) {
    return userService
      .getById(meta.userId, ['stationGroup'], true)
      .get('stationGroup')
      .then(stationGroup => filterUsers(owners, stationGroup));
  }

  return owners;
}

function filterEvents(owners) {
  const events = this;
  remove(events, event => findIndex(owners, (user) => {
    if (user.alias) {
      return user.alias === event.owner;
    }
    return user.username === event.owner;
  }) === -1);
  return events;
}

module.exports = function filterGroup(events, params) {
  const { meta } = params;
  const owners = uniq(events.map(event => event.owner));
  if (meta && (meta.stationGroup || meta.userId) && owners.length > 0) {
    const userService = this.services.user;

    return userService
      .getById(owners, ['alias', 'username', 'stationGroup'], true)
      // Filter owners by group
      .bind([userService, params])
      .then(filterOwners)
      // filter events
      .bind(events)
      .then(filterEvents);
  }
  return events;
};
