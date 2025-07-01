# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci --only=production
RUN cd frontend && npm ci --only=production

# Copy source code
COPY . .

# Build the frontend
RUN cd frontend && npm run build

# Copy built frontend to backend public directory
RUN mkdir -p backend/public && cp -r frontend/build/* backend/public/

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"] 