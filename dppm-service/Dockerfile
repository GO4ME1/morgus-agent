FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Expose port
EXPOSE 8080

# Set NODE_ENV and increase Node memory limit
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=400 --loader ts-node/esm"

# Start with node using ts-node/register
CMD ["node", "--require", "ts-node/register", "src/index.ts"]
