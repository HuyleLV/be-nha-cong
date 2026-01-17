FROM node:20-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies: prefer npm ci when lockfile exists, fall back to npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install --no-audit --no-fund; fi

# Copy source and build
COPY . .
RUN npm run build

EXPOSE 5000
CMD ["node", "dist/main.js"]
