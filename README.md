# Agent Management System

Complete full-stack application for agent quota management with passport upload and OCR capabilities.

## 🎯 Features

- **Quota Management**: Agents buy quota with credits, transfer to child agents
- **Passport Upload**: Browser-based OCR using Tesseract.js
- **Real-time Updates**: Socket.io for instant notifications
- **Role-based Access**: SuperAdmin, Admin, Agent, and Child roles
- **Fully Containerized**: Docker Compose deployment

## 🛠️ Technology Stack

### Backend
- Node.js 22 + Express + TypeScript
- MongoDB + Mongoose
- Socket.io (real-time)
- JWT Authentication
- Multer (file uploads)

### Frontend
- React 19 + Vite + TypeScript
- TanStack Query (server state)
- Zustand (client state)
- Mantine UI
- Tesseract.js (OCR)
- Socket.io Client

### Infrastructure
- PNPM Workspace (monorepo)
- Docker + Docker Compose
- Nginx (production)

## 📦 Installation

### Prerequisites
- Node.js 22+
- PNPM
- Docker & Docker Compose (for production)
- MongoDB (for local development)

### Setup

1. **Clone and install dependencies**:
```bash
cd agent-management
pnpm install
```

2. **Set up environment variables**:
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your configurations
```

3. **Run in development**:
```bash
# Run both backend and frontend
pnpm dev

# Or run separately
pnpm dev:backend
pnpm dev:frontend
```

Backend will run on `http://localhost:5000`  
Frontend will run on `http://localhost:5173`

## 🐳 Docker Deployment

### Production Build

```bash
# Build and start all services
pnpm docker:up

# View logs
pnpm docker:logs

# Stop all services
pnpm docker:down
```

Services will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- MongoDB: Internal network only

## 📁 Project Structure

```
agent-management/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/       # Auth, validation, etc
│   │   ├── models/           # Mongoose models
│   │   ├── routes/           # API routes
│   │   ├── sockets/          # Socket.io handlers
│   │   ├── utils/            # Helper functions
│   │   ├── validators/       # Zod schemas
│   │   ├── cron/             # Scheduled jobs
│   │   └── server.ts         # Entry point
│   ├── uploads/              # File storage (gitignored)
│   ├── Dockerfile
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/              # Axios instance
    │   ├── components/       # React components
    │   ├── pages/            # Page components
    │   ├── store/            # Zustand stores
    │   ├── hooks/            # Custom hooks
    │   ├── lib/              # Utilities
    │   ├── App.tsx
    │   └── main.tsx
    ├── Dockerfile
    ├── nginx.conf
    └── package.json
```

## 🔒 Business Rules

### Quota Purchase
- **Normal Quota**: Available when `todayPurchased < dailyPurchaseLimit` (20 credits/quota)
- **Extra Pool Quota**: Available when `todayPurchased === dailyPurchaseLimit` (20 credits/quota)
- **Transfer to Child**: Free, deducted from agent's quota balance
- **Live to Pool**: Agent returns unused quota (no refund)

### Daily Reset
- At 00:05 AM daily, `todayPurchased` resets to 0 for all agents

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Quota Operations (Agent)
- `POST /api/quota/buy-normal` - Purchase normal quota
- `POST /api/quota/buy-extra` - Purchase from pool
- `POST /api/quota/transfer-to-child` - Transfer to child
- `POST /api/quota/live-to-pool` - Return to pool

### Passport Operations
- `POST /api/passport/upload` - Upload passport with OCR data
- `GET /api/passport/image-token/:id` - Get signed image URL

### Admin Operations
- `GET /api/admin/passports` - List all passports
- `PUT /api/admin/passport/:id` - Update/verify passport
- `PUT /api/admin/user/:id/approve` - Approve agent
- `PUT /api/admin/user/:id/set-limit` - Set daily limit

## 🔌 Real-time Events

### Socket.io Events
- `pool-updated` → All agents (quota pool changes)
- `quota-balance-updated` → Specific user
- `credit-balance-updated` → Specific user
- `new-passport` → Admin room
- `passport-updated` → Admin room

## 🧪 Testing

```bash
# Backend tests
cd backend
pnpm test

# Frontend tests
cd frontend
pnpm test
```

## 📝 License

ISC

## 👨‍💻 Development

### Adding New Features
1. Create models in `backend/src/models/`
2. Add routes in `backend/src/routes/`
3. Create controllers in `backend/src/controllers/`
4. Add frontend pages in `frontend/src/pages/`
5. Update API calls in `frontend/src/api/`

### Code Style
- Backend: ESLint + TypeScript strict mode
- Frontend: ESLint + React hooks rules
- Both: Prettier for formatting

## 🚀 Deployment Notes

- Update `.env.production` with secure secrets
- Use secure MongoDB credentials
- Enable HTTPS in production
- Set up proper CORS origins
- Configure rate limiting
- Set up monitoring and logging
