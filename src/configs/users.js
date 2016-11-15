module.exports = {
  users: {
    prefix: 'users',
    postfix: {
      verify: 'verify',
      getMetadata: 'getMetadata',
    },
    timeouts: {
      verify: 2000,
      getMetadata: 2000,
    },
    audience: '*.localhost',
  },
};
