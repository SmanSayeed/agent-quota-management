# Build Stage
FROM node:20-alpine as build

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy monorepo files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/

# Install all dependencies (monorepo)
RUN pnpm install --frozen-lockfile

# Copy frontend source
COPY frontend ./frontend

# Build frontend
WORKDIR /app/frontend
RUN pnpm run build

# Production Stage
FROM nginx:alpine

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
