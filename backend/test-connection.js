// backend/test-connection.js
require('dotenv').config();
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { validateSlackConfig, getSlackAppConfig } = require('./config/slack');
const logger = require('./utils/logger');

async function testConnections() {
  console.log('🔍 Testing Slack Project Monitor connections...\n');

  try {
    // Test environment variables
    console.log('1. Testing environment variables...');
    validateSlackConfig();
    console.log('✅ Environment variables are valid\n');

    // Test MongoDB connection
    console.log('2. Testing MongoDB connection...');
    await connectDatabase();
    console.log('✅ MongoDB connection successful\n');

    // Test Slack configuration
    console.log('3. Testing Slack configuration...');
    const slackConfig = getSlackAppConfig();
    console.log('✅ Slack configuration valid');
    console.log(`   - Bot Token: ${slackConfig.token ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - App Token: ${slackConfig.appToken ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - Signing Secret: ${slackConfig.signingSecret ? '✅ Set' : '❌ Missing'}\n`);

    // Test channel configuration
    console.log('4. Testing channel configuration...');
    const { getChannelMap } = require('./config/slack');
    const channelMap = getChannelMap();
    console.log('✅ Channel mapping:');
    Object.entries(channelMap).forEach(([channelId, info]) => {
      console.log(`   - ${info.name}: ${channelId}`);
    });
    console.log('');

    console.log('🎉 All connection tests passed!');
    console.log('The Slack Project Monitor is ready to start.\n');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check your .env file exists and has all required variables');
    console.log('2. Verify MongoDB is running and accessible');
    console.log('3. Ensure Slack app is properly configured');
    console.log('4. Check network connectivity');
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

// Run the test
testConnections(); 