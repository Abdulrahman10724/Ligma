# ─────────────────────────────────────────────────────────────────
# Ligma Backend — Production Dockerfile (Node.js / Express)
# Multi-stage build: install deps in a build stage, copy a lean
# runtime image with only production dependencies + source.
# ─────────────────────────────────────────────────────────────────

# ---------- Stage 1: dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Install only what's needed to resolve deps first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund

# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Run as a non-root user for security
RUN addgroup -S nodejs && adduser -S expressjs -G nodejs

# Bring in production node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source (respects .dockerignore)
COPY . .

# Ensure the non-root user owns the app directory
RUN chown -R expressjs:nodejs /app
USER expressjs

EXPOSE 5000

# Basic container-level healthcheck against the app's /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:5000/health', res => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "index.js"]
