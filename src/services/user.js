const LightUserModel = require('../models/lightUserModel');
const Promise = require('bluebird');
const { NotFoundError, HttpStatusError } = require('common-errors');

function makeUser(userData) {
  const name = `${userData.firstName} ${userData.lastName}`;

  return new LightUserModel(
    userData.alias || userData.username,
    name,
    userData.roles
  );
}

function CheckNotFoundError(error) {
  return error.status === 404;
}

class UserService {
  constructor(config, amqp) {
    this.amqp = amqp;
    this.config = config;
  }

  login(token) {
    const { audience, prefix, postfix, timeouts } = this.config;

    const route = `${prefix}.${postfix.verify}`;
    const timeout = timeouts.verify;

    return this.amqp
      .publishAndWait(route, { token, audience }, { timeout })
      .then(response => makeUser(response.metadata[audience]));
  }

  getAliasForEvents(events) {
    const fields = ['alias', 'username'];
    const usernamesPool = {};

    events.forEach(UserService.pluckOwner, usernamesPool);
    const uniqueUsernames = Object.keys(usernamesPool);

    return Promise
      .bind(this, uniqueUsernames)
      .map(username => this.getById(username, fields))
      .then((mappedUsernames) => {
        uniqueUsernames.forEach((username, idx) => {
          usernamesPool[username] = mappedUsernames[idx].originalId;
        });

        events.forEach(UserService.setOwner, usernamesPool);

        return events;
      });
  }

  static pluckOwner(event) {
    this[event.owner] = undefined;
  }

  static setOwner(event) {
    event.owner = this[event.owner];
  }

  getById(username, fields) {
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
      .then(response => makeUser(response[audience]))
      .catch(HttpStatusError, CheckNotFoundError, () => {
        throw new NotFoundError(`User #${username} not found`);
      });
  }
}

module.exports = UserService;
