// backend/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  slackMessageId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  channelType: { 
    type: String, 
    required: true, 
    enum: ['main', 'production', 'client'] 
  },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, required: true },
  threadTs: { type: String },
  files: [{
    id: String,
    name: String,
    mimetype: String,
    url_private: String
  }],
  reactions: [{
    emoji: String,
    userId: String,
    timestamp: Date
  }],
  metadata: {
    userProfile: mongoose.Schema.Types.Mixed,
    isBot: Boolean
  },
  // AI Analysis Results
  analysis: {
    processed: { type: Boolean, default: false },
    processedAt: Date,
    sentiment: {
      score: Number, // -1 to 1
      label: String, // positive, neutral, negative
      confidence: Number
    },
    entities: [{
      type: String, // person, project, deliverable, deadline, etc.
      value: String,
      confidence: Number
    }],
    intent: {
      category: String, // request, update, concern, approval, etc.
      confidence: Number
    },
    priority: {
      level: String, // low, medium, high, urgent
      reasons: [String]
    },
    deliverables: [{
      name: String,
      status: String, // concept, in-progress, review, approved, delivered
      assignee: String,
      deadline: Date,
      confidence: Number
    }],
    actionItems: [{
      task: String,
      assignee: String,
      deadline: Date,
      confidence: Number
    }]
  }
}, {
  timestamps: true,
  indexes: [
    { channelId: 1, timestamp: -1 },
    { channelType: 1, timestamp: -1 },
    { userId: 1, timestamp: -1 },
    { 'analysis.processed': 1 }
  ]
});

// Index for efficient querying
messageSchema.index({ channelType: 1, timestamp: -1 });
messageSchema.index({ 'analysis.deliverables.status': 1 });
messageSchema.index({ 'analysis.priority.level': 1 });

module.exports = mongoose.model('Message', messageSchema);