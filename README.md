# Slack Project Monitor

An AI-powered Slack monitoring system designed for creative agency project oversight. This application listens to messages across three key Slack channels (main, production, client) and provides intelligent analysis and insights.

## Features

- **Multi-Channel Monitoring**: Tracks messages from main, production, and client channels
- **AI-Powered Analysis**: Analyzes messages for sentiment, entities, intent, and action items
- **MongoDB Storage**: Persistent storage of all messages and analysis results
- **Real-time Processing**: Immediate processing of new messages and reactions
- **Dashboard Interface**: Web-based dashboard for viewing insights and analytics
- **Scheduled Tasks**: Automated batch processing and daily digests
- **Error Handling**: Comprehensive error handling and logging

## Project Structure

```
slack-project-monitor/
├── backend/
│   ├── config/
│   │   ├── database.js      # MongoDB connection configuration
│   │   └── slack.js         # Slack app configuration
│   ├── controllers/         # API controllers
│   ├── middleware/          # Express middleware
│   ├── models/
│   │   └── Message.js       # MongoDB message schema
│   ├── routes/
│   │   └── api.js          # API routes
│   ├── services/
│   │   ├── slackListener.js # Slack event listener
│   │   └── aiProcessor.js   # AI analysis service
│   ├── utils/
│   │   └── logger.js        # Winston logging utility
│   └── server.js           # Main server file
├── frontend/
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   └── utils/          # Frontend utilities
│   └── package.json        # Frontend dependencies
├── logs/                   # Application logs
├── package.json           # Backend dependencies
├── env.example            # Environment variables template
└── README.md             # This file
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Slack App with appropriate permissions
- AI API key (Anthropic Claude or OpenAI)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd slack-project-monitor
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up MongoDB**
   - Local: Install and start MongoDB
   - Atlas: Create a cluster and get connection string

5. **Configure Slack App**
   - Create a new Slack app at https://api.slack.com/apps
   - Add bot token scopes: `channels:history`, `channels:read`, `users:read`, `reactions:read`
   - Enable Socket Mode
   - Install app to your workspace
   - Get channel IDs for the three channels you want to monitor

## Configuration

### Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
SLACK_SIGNING_SECRET=your-signing-secret

# Channel IDs
MAIN_CHANNEL_ID=C1234567890
PRODUCTION_CHANNEL_ID=C0987654321
CLIENT_CHANNEL_ID=C1357924680

# AI Configuration
ANTHROPIC_API_KEY=your-anthropic-key
# OR
OPENAI_API_KEY=your-openai-key

# Database
MONGODB_URI=mongodb://localhost:27017/slack-monitor

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Slack App Setup

1. **Create Slack App**
   - Go to https://api.slack.com/apps
   - Click "Create New App" → "From scratch"
   - Name: "Project Monitor"
   - Workspace: Select your workspace

2. **Configure OAuth & Permissions**
   - Go to "OAuth & Permissions"
   - Add bot token scopes:
     - `channels:history`
     - `channels:read`
     - `users:read`
     - `reactions:read`
     - `app_mentions:read`

3. **Enable Socket Mode**
   - Go to "Socket Mode"
   - Enable Socket Mode
   - Generate app-level token

4. **Install App**
   - Go to "Install App"
   - Click "Install to Workspace"
   - Copy bot user OAuth token

5. **Get Channel IDs**
   - Right-click each channel in Slack
   - Select "Copy link"
   - Extract channel ID from URL

## Usage

### Development

```bash
# Start both backend and frontend
npm run dev

# Start only backend
npm run server

# Start only frontend
npm run client
```

### Production

```bash
# Install dependencies
npm run install-all

# Build frontend
npm run build

# Start production server
npm start
```

### API Endpoints

- `GET /health` - Health check
- `GET /api/messages` - Get messages with filters
- `GET /api/analytics` - Get analytics data
- `GET /api/channels` - Get channel information

## Monitoring and Logs

Logs are stored in the `logs/` directory:
- `error.log` - Error-level logs
- `combined.log` - All logs

## Error Handling

The application includes comprehensive error handling:
- Slack API errors are logged and don't crash the app
- Database connection errors trigger graceful shutdown
- AI processing errors are logged and retried
- Rate limiting prevents API abuse

## Security Features

- Helmet.js for security headers
- Rate limiting on API endpoints
- CORS configuration
- Environment variable validation
- Input sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the logs in `logs/` directory
2. Verify environment variables are set correctly
3. Ensure Slack app has proper permissions
4. Check MongoDB connection

## Troubleshooting

### Common Issues

1. **Slack connection fails**
   - Verify bot token and app token
   - Check Socket Mode is enabled
   - Ensure app is installed to workspace

2. **MongoDB connection fails**
   - Verify MONGODB_URI is correct
   - Check MongoDB is running
   - Ensure network connectivity

3. **AI processing fails**
   - Verify API key is valid
   - Check API rate limits
   - Ensure sufficient credits

4. **Messages not being processed**
   - Check channel IDs are correct
   - Verify bot has channel access
   - Check logs for errors 