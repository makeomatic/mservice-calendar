const { omit } = require('lodash');

function transform(model, type) {
  const response = {
    id: model.id,
    type,
    attributes: omit(model, 'id'),
  };

  return response;
}

function transformModel(model, type) {
  const response = { data: model };

  if (model === null) {
    return response;
  }

  response.data = transform(response.data, type);

  return response;
}

module.exports = {
  transform,
  transformModel,
};
