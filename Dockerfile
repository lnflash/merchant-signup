FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy all files
COPY . .

# Build application
RUN npm run build

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

# Set to production environment
ENV NODE_ENV production

# Add user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy build output from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Set user
USER nextjs

# Expose port
EXPOSE 3000

# Set command
CMD ["npm", "start"]