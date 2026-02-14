FROM node:20-alpine AS builder

WORKDIR /app

# Install frontend deps first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build frontend
COPY public ./public
COPY src ./src

# Lower memory pressure during CRA build
ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS=--max_old_space_size=1024
RUN npm run build


FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install only backend runtime deps
COPY backend/package.json backend/package-lock.json ./backend/
RUN npm ci --omit=dev --prefix backend

# Copy runtime files
COPY backend ./backend
COPY --from=builder /app/build ./build

EXPOSE 5000

CMD ["node", "backend/server.js"]
