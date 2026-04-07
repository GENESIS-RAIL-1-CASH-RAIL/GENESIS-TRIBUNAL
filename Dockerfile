FROM node:20-alpine
WORKDIR /app

# Copy package files first (better layer caching)
COPY package.json package-lock.json* tsconfig.json ./

# Install ALL deps (including tsc) for the build step
RUN npm install --no-audit --no-fund

# Copy source
COPY src ./src

# Compile TypeScript to dist
RUN npx tsc

# Strip dev dependencies for a leaner runtime image
RUN npm prune --omit=dev

# Main service port (TRIBUNAL)
EXPOSE 8910

# Run the compiled output
CMD ["node", "dist/index.js"]
