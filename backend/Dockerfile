FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm build

# Create uploads directory
RUN mkdir -p /app/uploads/passports

# Expose port
EXPOSE 5000

# Start server
CMD ["pnpm", "start"]
