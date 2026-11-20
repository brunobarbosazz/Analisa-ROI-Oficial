'use strict';

const { handleProtectedAppRoute } = require('../lib/saas-auth');

module.exports = function appHandler(req, res) {
  return handleProtectedAppRoute(req, res);
};
