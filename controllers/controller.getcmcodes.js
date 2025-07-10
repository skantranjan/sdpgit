const { getAllCMCodes, getCMCodeByCode } = require('../models/model.getCMCodes');

/**
 * Controller to get unique CM codes from the database
 */
async function getCMCodesController(request, reply) {
  try {
    const cmCodes = await getAllCMCodes();
    
    reply.code(200).send({ 
      success: true, 
      count: cmCodes.length,
      data: cmCodes 
    });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ 
      success: false, 
      message: 'Failed to fetch CM codes', 
      error: error.message 
    });
  }
}

/**
 * Controller to get a specific CM code by code
 */
async function getCMCodeByCodeController(request, reply) {
  try {
    const { cm_code } = request.params;
    
    const cmCodeData = await getCMCodeByCode(cm_code);
    
    if (!cmCodeData) {
      return reply.code(404).send({ 
        success: false, 
        message: 'CM code not found' 
      });
    }
    
    reply.code(200).send({ 
      success: true, 
      data: cmCodeData 
    });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ 
      success: false, 
      message: 'Failed to fetch CM code', 
      error: error.message 
    });
  }
}

module.exports = { 
  getCMCodesController, 
  getCMCodeByCodeController 
}; 