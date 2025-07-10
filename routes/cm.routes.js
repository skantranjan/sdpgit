const { getCMCodesController, getCMCodeByCodeController } = require('../controllers/controller.getcmcodes');
const ssoMiddleware = require('../middleware/middleware.sso');

async function cmRoutes(fastify, options) {
  fastify.get('/cm-codes', { preHandler: ssoMiddleware }, getCMCodesController);
  fastify.get('/cm-codes/:cm_code', { preHandler: ssoMiddleware }, getCMCodeByCodeController);
}

module.exports = cmRoutes; 