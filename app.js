// Load environment variables
require('dotenv').config();
const fastify = require('fastify')({ logger: false });
const skuRoutes = require('./routes/sku.routes');
const cmRoutes = require('./routes/cm.routes');
const skuDetailsRoutes = require('./routes/skuDetails.routes');
const jwtMiddleware = require('./middleware/middleware.jwt');
const pool = require('./config/db.config');
const fastifyCors = require('@fastify/cors');
const skuAuditLogRoutes = require('./routes/skuAuditLog.routes');


// Register SKU routes
fastify.register(skuRoutes);

// Register CM routes
fastify.register(cmRoutes);

// Register SKU Details routes
fastify.register(skuDetailsRoutes);

// Register SKU Audit Log routes
fastify.register(skuAuditLogRoutes);

// Add JWT middleware globally
//fastify.addHook('preHandler', jwtMiddleware);

// Test database connection
fastify.get('/db-test', async (request, reply) => {
  try {
    const result = await pool.query('SELECT NOW()');
    return { 
      status: 'Database connected successfully', 
      timestamp: result.rows[0].now 
    };
  } catch (error) {
    fastify.log.error('Database connection failed:', error);
    return reply.code(500).send({ 
      status: 'Database connection failed', 
      error: error.message 
    });
  }
});

// Start server
const start = async () => {
  try {
    // Test database connection on startup
    await pool.query('SELECT NOW()');
   // fastify.log.info('Database connected successfully');
    
    fastify.register(fastifyCors, {
      origin: ['http://localhost:5000'],
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
    });
    
    await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
   // fastify.log.info(`Server running on port ${process.env.PORT || 3000}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 