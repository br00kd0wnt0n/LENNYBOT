// backend/services/aiProcessor.js
const axios = require('axios');
const logger = require('../utils/logger');
const Message = require('../models/Message');
const JSON5 = require('json5');

class AIProcessor {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }
  }

  async analyzeMessage(messageDoc) {
    try {
      const analysis = await this.processWithAI(messageDoc);
      
      // Validate and clean the analysis data
      const cleanedAnalysis = this.validateAndCleanAnalysis(analysis);
      
      // Save analysis back to message document
      await Message.findByIdAndUpdate(messageDoc._id, {
        'analysis.processed': true,
        'analysis.processedAt': new Date(),
        'analysis.sentiment': cleanedAnalysis.sentiment,
        'analysis.entities': cleanedAnalysis.entities,
        'analysis.intent': cleanedAnalysis.intent,
        'analysis.priority': cleanedAnalysis.priority,
        'analysis.deliverables': cleanedAnalysis.deliverables,
        'analysis.actionItems': cleanedAnalysis.actionItems
      });

      logger.info(`AI analysis completed for message ${messageDoc.slackMessageId}`);
      
    } catch (error) {
      logger.error('AI analysis failed:', error);
    }
  }

  validateAndCleanAnalysis(analysis) {
    const cleaned = {
      sentiment: { score: 0, label: 'neutral', confidence: 0 },
      entities: [],
      intent: { category: 'update', confidence: 0 },
      priority: { level: 'low', reasons: [] },
      deliverables: [],
      actionItems: []
    };

    // Clean sentiment
    if (analysis.sentiment) {
      cleaned.sentiment = {
        score: parseFloat(analysis.sentiment.score) || 0,
        label: analysis.sentiment.label || 'neutral',
        confidence: parseFloat(analysis.sentiment.confidence) || 0
      };
    }

    // Helper to robustly parse JS-like arrays and ensure proper object structure
    function robustParseArray(val) {
      if (Array.isArray(val)) {
        // Ensure each item has the required structure
        return val.map(item => {
          if (typeof item === 'object' && item !== null) {
            return item;
          }
          return null;
        }).filter(item => item !== null);
      }
      
      if (typeof val !== 'string') return [];
      
      let arr = [];
      let cleanedVal = val.trim();
      
      // Remove array brackets if present
      if (cleanedVal.startsWith('[') && cleanedVal.endsWith(']')) {
        cleanedVal = cleanedVal.slice(1, -1);
      }
      
      try {
        // First try JSON5
        arr = JSON5.parse(`[${cleanedVal}]`);
      } catch (e) {
        try {
          // Try to fix common issues and parse as JSON
          let fixed = cleanedVal
            .replace(/([a-zA-Z0-9_]+):/g, '"$1":') // quote keys
            .replace(/'/g, '"') // single to double quotes
            .replace(/\n/g, '') // remove newlines
            .replace(/\s+/g, ' '); // normalize whitespace
          
          arr = JSON.parse(`[${fixed}]`);
        } catch (e2) {
          try {
            // Last resort: try to extract objects using regex
            const objectRegex = /\{[^}]+\}/g;
            const matches = cleanedVal.match(objectRegex);
            if (matches) {
              arr = matches.map(match => {
                try {
                  const fixed = match
                    .replace(/([a-zA-Z0-9_]+):/g, '"$1":')
                    .replace(/'/g, '"');
                  return JSON.parse(fixed);
                } catch (e3) {
                  return null;
                }
              }).filter(item => item !== null);
            }
          } catch (e3) {
            logger.error('Failed to robustly parse array for AI analysis', { 
              value: val, 
              error: e3,
              attempts: [e.message, e2.message, e3.message]
            });
            arr = [];
          }
        }
      }
      
      // Ensure we return an array of proper objects
      if (Array.isArray(arr)) {
        return arr.map(item => {
          if (typeof item === 'object' && item !== null) {
            return item;
          }
          return null;
        }).filter(item => item !== null);
      }
      
      return [];
    }

    // Clean entities - ensure they have type, value, and confidence
    if (analysis.entities) {
      const parsedEntities = robustParseArray(analysis.entities);
      cleaned.entities = parsedEntities.map(entity => ({
        type: entity.type || 'unknown',
        value: entity.value || '',
        confidence: parseFloat(entity.confidence) || 0
      }));
    }
    
    // Clean deliverables - ensure they have the required structure
    if (analysis.deliverables) {
      const parsedDeliverables = robustParseArray(analysis.deliverables);
      cleaned.deliverables = parsedDeliverables.map(deliverable => ({
        name: deliverable.name || deliverable.value || '',
        status: deliverable.status || 'concept',
        assignee: deliverable.assignee || '',
        deadline: deliverable.deadline ? new Date(deliverable.deadline) : null,
        confidence: parseFloat(deliverable.confidence) || 0
      }));
    }
    
    // Clean actionItems - ensure they have the required structure
    if (analysis.actionItems) {
      const parsedActionItems = robustParseArray(analysis.actionItems);
      cleaned.actionItems = parsedActionItems.map(actionItem => ({
        task: actionItem.task || actionItem.value || '',
        assignee: actionItem.assignee || '',
        deadline: actionItem.deadline ? new Date(actionItem.deadline) : null,
        confidence: parseFloat(actionItem.confidence) || 0
      }));
    }

    // Clean intent
    if (analysis.intent) {
      cleaned.intent = {
        category: analysis.intent.category || 'update',
        confidence: parseFloat(analysis.intent.confidence) || 0
      };
    }
    
    // Clean priority
    if (analysis.priority) {
      cleaned.priority = {
        level: analysis.priority.level || 'low',
        reasons: Array.isArray(analysis.priority.reasons) ? analysis.priority.reasons : []
      };
    }
    
    return cleaned;
  }

  async processWithAI(messageDoc) {
    const prompt = this.buildPrompt(messageDoc);
    return await this.callOpenAI(prompt);
  }

  buildPrompt(messageDoc) {
    const channelContext = {
      main: "This is from the main title channel where strategic discussions, creative decisions, and overall project management happen.",
      production: "This is from the asset production channel where the studio team handles design/motion work, internal reviews and iterations.",
      client: "This is from the external client channel where clients make requests, review assets, and communicate concerns."
    };

    return `
You are analyzing a Slack message from a creative agency's ${messageDoc.channelType} channel.

${channelContext[messageDoc.channelType]}

Message Details:
- Author: ${messageDoc.userName}
- Channel: ${messageDoc.channelType}
- Text: "${messageDoc.text}"
- Timestamp: ${messageDoc.timestamp}

Please analyze this message and return a JSON response with the following structure:
{
  "sentiment": {
    "score": 0.5,
    "label": "positive|neutral|negative",
    "confidence": 0.8
  },
  "entities": [
    {
      "type": "person|project|deliverable|deadline|client|asset",
      "value": "extracted entity",
      "confidence": 0.9
    }
  ],
  "intent": {
    "category": "request|update|concern|approval|question|decision",
    "confidence": 0.8
  },
  "priority": {
    "level": "low|medium|high|urgent",
    "reasons": ["why this priority level"]
  },
  "deliverables": [
    {
      "name": "asset or deliverable name",
      "status": "concept|in-progress|review|approved|delivered",
      "assignee": "person responsible",
      "deadline": "2024-01-15T00:00:00Z",
      "confidence": 0.7
    }
  ],
  "actionItems": [
    {
      "task": "specific action needed",
      "assignee": "person responsible",
      "deadline": "2024-01-15T00:00:00Z",
      "confidence": 0.8
    }
  ]
}

IMPORTANT: Return ONLY valid JSON. Do not include any markdown formatting, code blocks, or additional text. Focus on extracting concrete information. If something is unclear or not mentioned, omit it or set confidence low.
`;
  }

  async callOpenAI(prompt) {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.1
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      const content = response.data.choices[0].message.content;
      
      // Clean the response content to ensure it's valid JSON
      const cleanedContent = content.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      try {
        return JSON.parse(cleanedContent);
      } catch (parseError) {
        logger.error('Failed to parse OpenAI response as JSON:', parseError);
        logger.error('Raw response:', content);
        // Return a default analysis structure
        return {
          sentiment: { score: 0, label: 'neutral', confidence: 0 },
          entities: [],
          intent: { category: 'update', confidence: 0 },
          priority: { level: 'low', reasons: [] },
          deliverables: [],
          actionItems: []
        };
      }
      
    } catch (error) {
      logger.error('OpenAI API error:', error);
      throw error;
    }
  }

  async batchProcessUnanalyzed() {
    try {
      const unprocessedMessages = await Message.find({
        'analysis.processed': { $ne: true }
      }).limit(10);

      for (const message of unprocessedMessages) {
        await this.analyzeMessage(message);
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      logger.error('Batch processing error:', error);
    }
  }
}

module.exports = new AIProcessor();