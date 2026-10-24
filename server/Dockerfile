# Production Dockerfile for DreamXec Backend Express API

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package definitions and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma Client
RUN npm ci
RUN npx prisma generate

# Copy application source
COPY . .


# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy application and dependencies from builder
COPY --from=builder /app /app

RUN chmod +x /app/entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["/app/entrypoint.sh"]