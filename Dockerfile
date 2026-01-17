# Repository: https://github.com/RareZyn/ai-lesson-planning
# Multi-stage Dockerfile for AI Lesson Planning System
# This Dockerfile builds both React frontend and Node.js backend in a single container
#
# WIF3005 - Framework-based Software Design and Development
# Alternative Assessment Jan 2026
#
# Build command: docker build -t ai-lesson-planning:latest .
# Run command: docker run -p 5000:5000 --env-file backend/.env ai-lesson-planning:latest

# ============================================
# Build Frontend
# ============================================
FROM node:18-alpine AS frontend-builder

# Set working directory for frontend
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/client/package*.json ./

# Install frontend dependencies
RUN npm ci --silent

# Copy frontend source code
COPY frontend/client/ ./

# Build the React application for production
RUN npm run build

# ============================================
# Backend
# ============================================
FROM node:18-alpine AS backend-builder

# Set working directory for backend
WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies (production only)
RUN npm ci --only=production

# ============================================
# Production Runtime
# ============================================
FROM node:18-alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Create app directory
WORKDIR /app

# Copy backend dependencies from builder stage
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules

# Copy backend source code
COPY backend/ ./backend/

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /app/frontend/build ./backend/public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the application port
EXPOSE 5000

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Set working directory to backend
WORKDIR /app/backend

# Start the backend server (which will serve the frontend static files)
CMD ["npm", "start"]
