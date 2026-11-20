'use strict';

const { handleAuthApi } = require('../../lib/saas-auth');

module.exports = function authHandler(req, res) {
  return handleAuthApi(req, res);
};
