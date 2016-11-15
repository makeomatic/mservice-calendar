const LightUserModel = require('../models/lightUserModel');
const { NotFoundError, HttpStatusError } = require('common-errors');

function makeUser(userData) {
  const name = `${userData.firstName} ${userData.lastName}`;

  return new LightUserModel(
    userData.username,
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

  getById(username) {
    const { audience, prefix, postfix, timeouts } = this.config;

    const route = `${prefix}.${postfix.getMetadata}`;
    const timeout = timeouts.getMetadata;

    return this.amqp
      .publishAndWait(route, { username, audience }, { timeout })
      .then(response => makeUser(response[audience]))
      .catch(HttpStatusError, CheckNotFoundError, () => {
        throw new NotFoundError(`User #${username} not found`);
      });
  }
}

module.exports = UserService;
