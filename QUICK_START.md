# Quick Start Guide

Get your Slack Project Monitor running in 5 minutes!

## Prerequisites

- Node.js 16+ installed
- MongoDB running (local or Atlas)
- Slack workspace with admin access
- AI API key (Anthropic or OpenAI)

## Step 1: Clone and Setup

```bash
git clone <your-repo>
cd slack-project-monitor
./start.sh
```

## Step 2: Configure Environment

Edit `.env` file with your settings:

```bash
# Slack App (create at https://api.slack.com/apps)
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
SLACK_SIGNING_SECRET=your-signing-secret

# Channel IDs (right-click channel → Copy link → extract ID)
MAIN_CHANNEL_ID=C1234567890
PRODUCTION_CHANNEL_ID=C0987654321
CLIENT_CHANNEL_ID=C1357924680

# AI API (choose one)
ANTHROPIC_API_KEY=your-anthropic-key
# OR
OPENAI_API_KEY=your-openai-key

# Database
MONGODB_URI=mongodb://localhost:27017/slack-monitor
```

## Step 3: Slack App Setup

1. Go to https://api.slack.com/apps
2. Create New App → From scratch
3. Add bot token scopes:
   - `channels:history`
   - `channels:read`
   - `users:read`
   - `reactions:read`
4. Enable Socket Mode
5. Install to workspace
6. Copy tokens to `.env`

## Step 4: Get Channel IDs

1. Right-click each channel in Slack
2. Select "Copy link"
3. Extract channel ID from URL
4. Add to `.env` file

## Step 5: Start the Application

```bash
npm run dev
```

The app will be available at:
- Backend API: http://localhost:3001
- Frontend Dashboard: http://localhost:3000

## Verify It's Working

1. Check logs in `logs/` directory
2. Send a message in one of your monitored channels
3. Check the dashboard for new messages
4. Verify AI analysis is working

## Troubleshooting

- **Connection failed**: Run `npm run test:connection`
- **Messages not appearing**: Check channel IDs and bot permissions
- **AI not working**: Verify API key and credits
- **Database issues**: Check MongoDB connection string

## Next Steps

- Customize the AI prompts in `backend/services/aiProcessor.js`
- Add more channels in `backend/config/slack.js`
- Extend the dashboard in `frontend/src/components/`
- Set up production deployment

Need help? Check the full README.md for detailed documentation. 