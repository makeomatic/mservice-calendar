const request = require('request-promise');

module.exports = (uri, body) => {
  const options = {
    json: true,
    method: 'POST',
    resolveWithFullResponse: true,
    simple: false,
    uri,
  };

  if (body !== undefined) {
    options.body = body;
  }

  return request(options);
};
