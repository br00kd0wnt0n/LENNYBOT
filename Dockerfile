# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies (including dev dependencies needed for build)
RUN npm install
RUN cd frontend && npm install

# Copy source code
COPY . .

# Build the frontend (set CI=false to prevent treating warnings as errors)
ENV CI=false
ENV NODE_ENV=production
RUN cd frontend && npm run build

# Copy built frontend to backend public directory
RUN mkdir -p backend/public && cp -r frontend/build/* backend/public/

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"] 