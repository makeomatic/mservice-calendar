const Errors = require('common-errors');
const Promise = require('bluebird');

module.exports = function isAdmin(request) {
  const { auth } = request;
  const user = auth.credentials.user;

  if (user.isAdmin !== true) {
    throw new Errors.HttpStatusError(403, 'Access to this action is denied');
  }

  return Promise.resolve(request);
};
