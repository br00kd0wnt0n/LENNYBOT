// backend/services/slackListener.js
const { App } = require('@slack/bolt');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const Message = require('../models/Message');
const { getSlackAppConfig, getChannelMap, validateSlackConfig } = require('../config/slack');

class SlackListener {
  constructor() {
    // Validate configuration before initializing
    validateSlackConfig();
    
    this.app = new App(getSlackAppConfig());
    this.channelMap = getChannelMap();
    
    this.setupEventHandlers();
    logger.info('SlackListener initialized with channel mapping:', Object.keys(this.channelMap));
  }

  setupEventHandlers() {
    // Listen to all messages in monitored channels
    this.app.message(async ({ message, client }) => {
      try {
        // Only process messages from our monitored channels
        if (!this.channelMap[message.channel]) {
          return;
        }

        const channelInfo = this.channelMap[message.channel];
        const channelType = channelInfo.name;
        
        // Skip bot messages and message edits
        if (message.subtype === 'bot_message' || message.subtype === 'message_changed') {
          return;
        }

        // Get user info
        const userInfo = await client.users.info({ user: message.user });
        
        // Store message in database
        const messageDoc = new Message({
          slackMessageId: message.ts,
          channelId: message.channel,
          channelType: channelType,
          userId: message.user,
          userName: userInfo.user.real_name || userInfo.user.name,
          text: message.text,
          timestamp: new Date(parseFloat(message.ts) * 1000),
          threadTs: message.thread_ts,
          files: message.files || [],
          reactions: [],
          metadata: {
            userProfile: userInfo.user.profile,
            isBot: userInfo.user.is_bot
          }
        });

        await messageDoc.save();
        
        logger.info(`Message stored from ${channelType} channel by ${messageDoc.userName}`);
        
        // Trigger AI processing for new message
        this.processMessage(messageDoc);
        
      } catch (error) {
        logger.error('Error processing message:', error);
        // Don't throw error to prevent app crash, just log it
      }
    });

    // Listen to reactions
    this.app.event('reaction_added', async ({ event }) => {
      try {
        if (!this.channelMap[event.item.channel]) return;
        
        await Message.findOneAndUpdate(
          { slackMessageId: event.item.ts },
          { 
            $push: { 
              reactions: {
                emoji: event.reaction,
                userId: event.user,
                timestamp: new Date()
              }
            }
          }
        );
        
        logger.debug(`Reaction added to message ${event.item.ts}`);
      } catch (error) {
        logger.error('Error processing reaction:', error);
      }
    });

    // Handle app errors
    this.app.error((error) => {
      logger.error('Slack app error:', error);
    });
  }

  async processMessage(messageDoc) {
    try {
      // Queue message for AI processing
      const aiProcessor = require('./aiProcessor');
      await aiProcessor.analyzeMessage(messageDoc);
    } catch (error) {
      logger.error('Error in AI processing:', error);
    }
  }

  async start() {
    try {
      // Add error handlers to prevent crashes
      this.app.error((error) => {
        logger.error('Slack app error:', error);
      });
      
      // Add connection error handling
      if (this.app.client.socketMode) {
        this.app.client.socketMode.on('unable_to_socket_mode_start', (error) => {
          logger.error('Unable to start socket mode:', error);
        });
        
        this.app.client.socketMode.on('disconnect', (error) => {
          logger.warn('Socket mode disconnected:', error);
        });
      }
      
      await this.app.start();
      logger.info('Slack listener started successfully');
    } catch (error) {
      logger.error('Failed to start Slack listener:', error);
      // Don't throw error to prevent server crash, just log it
      // The server can still run without Slack connection
    }
  }

  async stop() {
    try {
      await this.app.stop();
      logger.info('Slack listener stopped');
    } catch (error) {
      logger.error('Error stopping Slack listener:', error);
    }
  }
}

module.exports = SlackListener;