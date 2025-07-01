# Railway Deployment Guide

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Push your code to GitHub
3. **Slack App**: Ensure your Slack app is configured

## Step 1: Deploy to Railway

### Option A: Deploy from GitHub (Recommended)

1. **Connect GitHub Repository**:
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure Build Settings**:
   - Railway will automatically detect the Node.js project
   - Build command: `npm run build:prod`
   - Start command: `npm start`

### Option B: Deploy from CLI

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**:
   ```bash
   railway login
   railway init
   railway up
   ```

## Step 2: Add MongoDB Database

1. **Add MongoDB Plugin**:
   - In your Railway project dashboard
   - Click "New" → "Database" → "MongoDB"
   - Railway will automatically provision a MongoDB instance

2. **Get Connection String**:
   - Click on the MongoDB service
   - Copy the connection string from the "Connect" tab
   - It will look like: `mongodb+srv://username:password@cluster.mongodb.net/database`

## Step 3: Configure Environment Variables

In your Railway project dashboard, go to "Variables" and add:

### Required Variables:
```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/slack-monitor
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_MAIN_CHANNEL_ID=C0938GD27RC
SLACK_PRODUCTION_CHANNEL_ID=C093CKFEW93
SLACK_CLIENT_CHANNEL_ID=C093FRP3D9A
```

### Optional Variables:
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

## Step 4: Deploy Frontend

The frontend will be built and served by the backend in production. The build process:

1. Builds the React app (`npm run build`)
2. Copies build files to `backend/public/`
3. Serves static files from the Express server

## Step 5: Configure Custom Domain (Optional)

1. **Add Custom Domain**:
   - In Railway dashboard, go to "Settings" → "Domains"
   - Add your custom domain
   - Update DNS records as instructed

## Step 6: Monitor and Scale

### Monitoring:
- **Logs**: View real-time logs in Railway dashboard
- **Metrics**: Monitor CPU, memory, and network usage
- **Health Checks**: Automatic health checks at `/health`

### Scaling:
- **Auto-scaling**: Railway can auto-scale based on traffic
- **Manual scaling**: Adjust resources in the dashboard

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check build logs in Railway dashboard
   - Ensure all dependencies are in `package.json`

2. **MongoDB Connection Issues**:
   - Verify `MONGODB_URI` is correctly set
   - Check MongoDB service is running

3. **Slack Connection Issues**:
   - Verify all Slack tokens are correct
   - Check Slack app permissions

4. **Port Issues**:
   - Railway automatically sets `PORT` environment variable
   - Ensure your app uses `process.env.PORT`

### Useful Commands:

```bash
# View logs
railway logs

# Check status
railway status

# Redeploy
railway up

# Open in browser
railway open
```

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **CORS**: Configure CORS for production domains
3. **Rate Limiting**: Adjust rate limits for production traffic
4. **SSL**: Railway provides automatic SSL certificates

## Cost Optimization

1. **Resource Limits**: Start with minimal resources
2. **Auto-scaling**: Enable auto-scaling for cost efficiency
3. **Monitoring**: Monitor usage to optimize costs

## Next Steps

After deployment:

1. **Test the Application**: Verify all features work in production
2. **Set Up Monitoring**: Configure alerts and monitoring
3. **Backup Strategy**: Set up MongoDB backups
4. **CI/CD**: Configure automatic deployments from Git 