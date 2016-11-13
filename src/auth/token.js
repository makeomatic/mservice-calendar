const authService = require('../services/auth');

function auth({ params }) {
  return authService(params.token, this)
    .then(user => ({ user }));
}

module.exports = auth;
