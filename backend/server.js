// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const path = require('path');

const { connectDatabase, disconnectDatabase } = require('./config/database');
const SlackListener = require('./services/slackListener');
const apiRoutes = require('./routes/api');
const aiProcessor = require('./services/aiProcessor');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// CORS middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Initialize Slack listener
async function initializeSlackListener() {
  try {
    const slackListener = new SlackListener();
    await slackListener.start();
    logger.info('Slack listener initialized');
    return slackListener;
  } catch (error) {
    logger.error('Failed to initialize Slack listener:', error);
    // Return null instead of throwing to allow server to continue
    return null;
  }
}

// Scheduled tasks
function setupScheduledTasks() {
  // Process unanalyzed messages every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      logger.info('Running batch AI processing...');
      await aiProcessor.batchProcessUnanalyzed();
    } catch (error) {
      logger.error('Batch AI processing failed:', error);
    }
  });

  // Daily digest generation (8 AM)
  cron.schedule('0 8 * * *', async () => {
    try {
      logger.info('Generating daily digest...');
      // This could trigger email notifications or dashboard updates
    } catch (error) {
      logger.error('Daily digest generation failed:', error);
    }
  });

  logger.info('Scheduled tasks configured');
}

// Graceful shutdown
function setupGracefulShutdown(slackListener) {
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    
    try {
      if (slackListener) {
        await slackListener.stop();
      }
      await disconnectDatabase();
      logger.info('Shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await connectDatabase();
    
    // Initialize Slack listener
    const slackListener = await initializeSlackListener();
    
    // Setup scheduled tasks
    setupScheduledTasks();
    
    // Setup graceful shutdown (only if slackListener exists)
    if (slackListener) {
      setupGracefulShutdown(slackListener);
    }
    
    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info('Slack Project Monitor is now active');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();