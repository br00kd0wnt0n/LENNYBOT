const logger = require('../utils/logger');

const validateSlackConfig = () => {
  const requiredEnvVars = [
    'SLACK_BOT_TOKEN',
    'SLACK_APP_TOKEN', 
    'SLACK_SIGNING_SECRET',
    'MAIN_CHANNEL_ID',
    'PRODUCTION_CHANNEL_ID',
    'CLIENT_CHANNEL_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required Slack environment variables: ${missingVars.join(', ')}`);
  }

  logger.info('Slack configuration validated successfully');
};

const getChannelMap = () => {
  return {
    [process.env.MAIN_CHANNEL_ID]: {
      name: 'main',
      description: 'Main title channel for strategic discussions and project management'
    },
    [process.env.PRODUCTION_CHANNEL_ID]: {
      name: 'production', 
      description: 'Asset production channel for design/motion work and internal reviews'
    },
    [process.env.CLIENT_CHANNEL_ID]: {
      name: 'client',
      description: 'External client channel for client requests and feedback'
    }
  };
};

const getSlackAppConfig = () => {
  return {
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
  };
};

module.exports = {
  validateSlackConfig,
  getChannelMap,
  getSlackAppConfig
}; 