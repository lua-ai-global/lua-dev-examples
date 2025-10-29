# Stage 1: Build Stage
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy package.json and tsconfig.json
# Paths are now relative to the 'bot' directory
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy the bot's source code
COPY src ./src

# Compile TypeScript to JavaScript
RUN npm run build

# Stage 2: Production Stage
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy compiled code and production dependencies from the builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./

# The command to run the bot
CMD ["npm", "start"]
