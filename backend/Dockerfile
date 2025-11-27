FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy monorepo files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json ./backend/

# Install all dependencies (monorepo)
RUN pnpm install --frozen-lockfile

# Copy backend source
COPY backend ./backend

# Build backend
WORKDIR /app/backend
RUN pnpm run build

EXPOSE 5000

CMD ["pnpm", "start"]
