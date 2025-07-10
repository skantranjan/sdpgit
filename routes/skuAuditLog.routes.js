const { insertSkuAuditLogController } = require('../controllers/controller.skuAuditLog');
const ssoMiddleware = require('../middleware/middleware.sso');

async function skuAuditLogRoutes(fastify, options) {
  fastify.post('/sku-auditlog/add', { preHandler: ssoMiddleware }, insertSkuAuditLogController);
}

module.exports = skuAuditLogRoutes; 