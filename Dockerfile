# Production Dockerfile for Backend (multi-stage)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files (this will include package-lock.json if present)
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies: prefer npm ci when lockfile present, otherwise fall back to npm install
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund --silent; else npm install --no-audit --no-fund --silent; fi

# Copy full source and build
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

# Copy production build artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production

# Install only production deps (prefer ci when lockfile present)
RUN if [ -f package-lock.json ]; then npm ci --omit=dev --no-audit --no-fund --silent; else npm install --omit=dev --no-audit --no-fund --silent; fi

EXPOSE 5000

CMD ["node", "dist/main.js"]
