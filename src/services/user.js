const Promise = require('bluebird');
const passThrough = require('lodash/identity');
const partial = require('lodash/partial');
const { NotFoundError, HttpStatusError } = require('common-errors');
const LightUserModel = require('../models/lightUserModel');

const { isArray } = Array;
function makeUser(userData) {
  const name = `${userData.firstName} ${userData.lastName}`;

  return new LightUserModel(
    userData.username || userData.alias,
    name,
    userData.roles
  );
}

function makeUsers(data) {
  if (isArray(data)) {
    return data.map(makeUser);
  }
  return makeUser(data);
}

function CheckNotFoundError(error) {
  return error.status === 404;
}

class UserService {
  constructor(config, amqp) {
    this.amqp = amqp;
    this.config = config;

    // this is used to fetch aliases for the username and then post it instead of saved
    // owners email or other internal id
    this.getAliasOrUsernameById = partial(
      this.getById,
      partial.placeholder,
      ['alias', 'username'],
      true
    );
  }

  login(token) {
    const { audience, prefix, postfix, timeouts } = this.config;

    const route = `${prefix}.${postfix.verify}`;
    const timeout = timeouts.verify;

    return this.amqp
      .publishAndWait(route, { token, audience }, { timeout })
      .get('metadata')
      .get(audience)
      .then(makeUser);
  }

  getAliasForEvents(events) {
    const usernamesPool = {};

    events.forEach(UserService.pluckOwner, usernamesPool);
    const uniqueUsernames = Object.keys(usernamesPool);

    return Promise
      .bind(this, uniqueUsernames)
      .map(this.getAliasOrUsernameById)
      .bind({ usernamesPool, uniqueUsernames, events })
      .then(UserService.remapUsernames);
  }

  static enrichPool(username, idx) {
    const user = this.mappedUsernames[idx];
    this.usernamesPool[username] = user.alias || user.username;
  }

  static remapUsernames(mappedUsernames) {
    const { usernamesPool } = this;
    this.uniqueUsernames.forEach(UserService.enrichPool, { usernamesPool, mappedUsernames });
    this.events.forEach(UserService.setOwner, usernamesPool);
    return this.events;
  }

  static pluckOwner(event) {
    this[event.owner] = undefined;
  }

  static setOwner(event) {
    event.owner = this[event.owner];
  }

  getById(username, fields, doNotWrapInUser = false) {
    const { audience, prefix, postfix, timeouts } = this.config;

    const route = `${prefix}.${postfix.getMetadata}`;
    const timeout = timeouts.getMetadata;
    const message = { username, audience };

    // add fields we are interested in
    if (fields) {
      message.fields = { [audience]: fields };
    }

    return this.amqp
      .publishAndWait(route, message, { timeout, cache: 60000 })
      .then((data) => {
        if (isArray(data)) {
          return data.map(item => item[audience]);
        }
        return data[audience];
      })
      .then(doNotWrapInUser ? passThrough : makeUsers)
      .catch(HttpStatusError, CheckNotFoundError, () => {
        throw new NotFoundError(`User #${username} not found`);
      });
  }
}

module.exports = UserService;
