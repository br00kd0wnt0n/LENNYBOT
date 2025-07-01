# Use Node.js 20 for better compatibility
FROM node:20

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies (including dev dependencies needed for build)
RUN npm ci
RUN cd frontend && npm ci

# Copy source code
COPY . .

# Set build environment variables
ENV CI=false
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
ENV SKIP_PREFLIGHT_CHECK=true
ENV DISABLE_ESLINT_PLUGIN=true

# Build the frontend with explicit React Scripts build
RUN cd frontend && npx react-scripts build

# Copy built frontend to backend public directory
RUN mkdir -p backend/public && cp -r frontend/build/* backend/public/

# Expose port
EXPOSE 3001

# Start the application with production environment
CMD ["sh", "-c", "NODE_ENV=production npm start"] 