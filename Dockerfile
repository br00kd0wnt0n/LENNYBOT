# Multi-stage build for better reliability
# Build stage
FROM node:20 AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install all dependencies (including dev dependencies for build)
RUN npm ci
RUN cd frontend && npm ci

# Copy source code
COPY . .

# Build the frontend
ENV CI=false
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
ENV SKIP_PREFLIGHT_CHECK=true
ENV DISABLE_ESLINT_PLUGIN=true

RUN cd frontend && npm run build

# Production stage
FROM node:20 AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built frontend from builder stage
COPY --from=builder /app/frontend/build ./backend/public

# Copy backend source
COPY backend ./backend

# Expose port
EXPOSE 3001

# Start the application
CMD ["sh", "-c", "NODE_ENV=production npm start"] 