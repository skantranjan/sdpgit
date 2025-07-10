const { getSkuDetailsByCMCode, getAllSkuDetails, updateIsActiveStatus, getActiveYears, getAllSkuDescriptions, insertSkuDetail, updateSkuDetailBySkuCode } = require('../models/model.getSkuDetails');

/**
 * Controller to get SKU details filtered by CM code
 */
async function getSkuDetailsByCMCodeController(request, reply) {
  try {
    const { cm_code } = request.params;
    
    const skuDetails = await getSkuDetailsByCMCode(cm_code);
    
    reply.code(200).send({ 
      success: true, 
      count: skuDetails.length,
      cm_code: cm_code,
      data: skuDetails 
    });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ 
      success: false, 
      message: 'Failed to fetch SKU details', 
      error: error.message 
    });
  }
}

/**
 * Controller to get all SKU details
 */
async function getAllSkuDetailsController(request, reply) {
  try {
    const skuDetails = await getAllSkuDetails();
    
    reply.code(200).send({ 
      success: true, 
      count: skuDetails.length,
      data: skuDetails 
    });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ 
      success: false, 
      message: 'Failed to fetch SKU details', 
      error: error.message 
    });
  }
}

/**
 * Controller to update is_active status for a SKU detail by id
 */
async function updateIsActiveStatusController(request, reply) {
  try {
    const { id } = request.params;
    const { is_active } = request.body;
    if (typeof is_active !== 'boolean') {
      return reply.code(400).send({ success: false, message: 'is_active must be a boolean' });
    }
    const updated = await updateIsActiveStatus(id, is_active);
    if (!updated) {
      return reply.code(404).send({ success: false, message: 'SKU detail not found' });
    }
    reply.code(200).send({ success: true, data: updated });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ success: false, message: 'Failed to update is_active status', error: error.message });
  }
}

/**
 * Controller to get unique active years (period)
 */
async function getActiveYearsController(request, reply) {
  try {
    const years = await getActiveYears();
    reply.code(200).send({ success: true, count: years.length, years });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ success: false, message: 'Failed to fetch years', error: error.message });
  }
}

/**
 * Controller to get all sku_description values
 */
async function getAllSkuDescriptionsController(request, reply) {
  try {
    const descriptions = await getAllSkuDescriptions();
    reply.code(200).send({ success: true, count: descriptions.length, descriptions });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ success: false, message: 'Failed to fetch sku descriptions', error: error.message });
  }
}

/**
 * Controller to insert a new SKU detail
 */
async function insertSkuDetailController(request, reply) {
  try {
    const {
      sku_code,
      sku_description,
      cm_code,
      cm_description,
      sku_reference,
      is_active,
      created_by,
      created_date,
      period,
      purchased_quantity,
      sku_reference_check,
      formulation_reference,
      dual_source_sku
    } = request.body;

    // Manual validation for custom error messages
    if (!sku_code || sku_code.trim() === '') {
      return reply.code(400).send({ success: false, message: 'A value is required for SKU code' });
    }
    if (!sku_description || sku_description.trim() === '') {
      return reply.code(400).send({ success: false, message: 'A value is required for SKU description' });
    }

    // Include all fields in the data object
    const data = {
      sku_code,
      sku_description,
      cm_code,
      cm_description,
      sku_reference,
      is_active,
      created_by,
      created_date,
      period,
      purchased_quantity,
      sku_reference_check,
      formulation_reference,
      dual_source_sku
    };

    const inserted = await insertSkuDetail(data);
    reply.code(201).send({ success: true, data: inserted });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ success: false, message: 'Failed to insert SKU detail', error: error.message });
  }
}

/**
 * Controller to update a SKU detail by sku_code
 */
async function updateSkuDetailBySkuCodeController(request, reply) {
  try {
    const { sku_code } = request.params;
    const {
      sku_description,
      period,
      sku_reference,
      is_active,
      created_by,
      created_date,
      purchased_quantity,
      sku_reference_check,
      formulation_reference,
      dual_source_sku
    } = request.body;
    // Validation
    if (!sku_code || sku_code.trim() === '') {
      return reply.code(400).send({ success: false, message: 'A value is required for SKU code' });
    }
    if (!sku_description || sku_description.trim() === '') {
      return reply.code(400).send({ success: false, message: 'A value is required for SKU description' });
    }
    if (!period || period.trim() === '') {
      return reply.code(400).send({ success: false, message: 'A value is required for period' });
    }
    const data = {
      sku_description,
      period,
      sku_reference,
      is_active,
      created_by,
      created_date,
      purchased_quantity,
      sku_reference_check,
      formulation_reference,
      dual_source_sku
    };
    const updated = await updateSkuDetailBySkuCode(sku_code, data);
    if (!updated) {
      return reply.code(404).send({ success: false, message: 'SKU detail not found' });
    }
    reply.code(200).send({ success: true, data: updated });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ success: false, message: 'Failed to update SKU detail', error: error.message });
  }
}

module.exports = {
  getSkuDetailsByCMCodeController,
  getAllSkuDetailsController,
  updateIsActiveStatusController,
  getActiveYearsController,
  getAllSkuDescriptionsController,
  insertSkuDetailController,
  updateSkuDetailBySkuCodeController
}; 