function login(amqp, userId, password) {
  return amqp.publishAndWait('users.login', {
    password,
    audience: '*.localhost',
    username: userId,
  });
}

module.exports = {
  login,
};
