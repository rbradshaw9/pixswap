# Server Dockerfile
FROM node:18-alpine AS server-base

WORKDIR /app/server

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY server/src ./src
COPY server/tsconfig.json ./

# Build TypeScript
RUN npm run build

FROM node:18-alpine AS server-production

WORKDIR /app

# Copy built application
COPY --from=server-base /app/server/dist ./dist
COPY --from=server-base /app/server/node_modules ./node_modules
COPY --from=server-base /app/server/package*.json ./

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the server
CMD ["node", "dist/server.js"]