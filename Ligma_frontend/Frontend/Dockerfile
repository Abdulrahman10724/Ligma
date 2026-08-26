# ─────────────────────────────────────────────────────────────────
# Scrybe Frontend — Production Dockerfile (React / Vite)
# Multi-stage build: compile static assets with Node, then serve
# them from a lean nginx image.
# ─────────────────────────────────────────────────────────────────

# ---------- Stage 1: build ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

COPY . .

# Optional build-time overrides. Defaults already match this Compose
# setup (backend published on host port 5000), so these are only needed
# if you point the frontend at a different backend URL.
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL}

RUN npm run build

# ---------- Stage 2: runtime (nginx) ----------
FROM nginx:1.27-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80 >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
