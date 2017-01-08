const is = require('is');
const LightUserModel = require('../models/lightUserModel');
const Promise = require('bluebird');
const uid2 = require('uid2');
const uuid = require('uuid');

const { ROLE_GUEST } = LightUserModel;

function auth(token, application) {
  if (is.undefined(token)) {
    return Promise.resolve(new LightUserModel(uuid.v4(), `Guest#${uid2(6)}`, [ROLE_GUEST]));
  }

  return application.services.user.login(token);
}

module.exports = auth;
