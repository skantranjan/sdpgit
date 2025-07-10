const { getSkuDetailsByCMCodeController, getAllSkuDetailsController, updateIsActiveStatusController, getActiveYearsController, getAllSkuDescriptionsController, insertSkuDetailController, updateSkuDetailBySkuCodeController } = require('../controllers/controller.getSkuDetails');
const ssoMiddleware = require('../middleware/middleware.sso');

async function skuDetailsRoutes(fastify, options) {
  fastify.get('/sku-details', { preHandler: ssoMiddleware }, getAllSkuDetailsController);
  fastify.get('/sku-details/:cm_code', { preHandler: ssoMiddleware }, getSkuDetailsByCMCodeController);
  fastify.patch('/sku-details/:id/is-active', { preHandler: ssoMiddleware }, updateIsActiveStatusController);
  fastify.get('/sku-details-active-years', { preHandler: ssoMiddleware }, getActiveYearsController);
  fastify.get('/sku-descriptions', { preHandler: ssoMiddleware }, getAllSkuDescriptionsController);
  fastify.post('/sku-details/add', { preHandler: ssoMiddleware }, insertSkuDetailController);
  fastify.put('/sku-details/update/:sku_code', { preHandler: ssoMiddleware }, updateSkuDetailBySkuCodeController);
}

module.exports = skuDetailsRoutes; 