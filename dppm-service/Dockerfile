# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for build)
RUN npm install

# Copy tsconfig.json first
COPY tsconfig.json ./

# Copy source code
COPY src ./src

# Build TypeScript to JavaScript (ignore errors)
RUN npx tsc || true

# Production stage
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy compiled JavaScript from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 8080

# Set production environment
ENV NODE_ENV=production

# Start the compiled application
CMD ["node", "dist/index.js"]
