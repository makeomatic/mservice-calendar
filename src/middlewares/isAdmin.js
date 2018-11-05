const Errors = require('common-errors');

module.exports = async function isAdmin(request) {
  const { auth } = request;
  const { user } = auth.credentials;

  if (user.isAdmin !== true) {
    throw new Errors.HttpStatusError(403, 'Access to this action is denied');
  }

  return request;
};
