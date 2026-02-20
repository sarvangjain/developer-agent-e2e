'use strict';

const { getRoutes: queryRoutes } = require('../db/symbol-client');

function getRoutes(domain) {
  const routes = queryRoutes(domain || '*');
  return {
    count: routes.length,
    routes: routes.map(r => ({
      name: r.name,
      method: r.method.toUpperCase(),
      path: r.path,
      handler: r.handler,
      handler_function: r.handler_function,
      controller_file: r.controller_file,
      file_path: r.file_path,
      public_access: !!r.public_access,
    })),
  };
}

module.exports = { getRoutes };
