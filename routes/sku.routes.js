const { saveSkuController } = require('../controllers/controller.savesku');
const ssoMiddleware = require('../middleware/middleware.sso');

async function skuRoutes(fastify, options) {
  fastify.post('/sku', { preHandler: ssoMiddleware }, saveSkuController);
}

module.exports = skuRoutes; 