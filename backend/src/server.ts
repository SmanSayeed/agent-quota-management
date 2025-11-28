import express, { Application } from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { initializeSocket } from './sockets';
import { setupCronJobs } from './cron';
import { initializePool, runDatabaseSeed } from './utils';
import { authRoutes, quotaRoutes, adminRoutes, passportRoutes, creditRoutes, settingsRoutes } from './routes';
import quotaRequestRoutes from './routes/quotaRequestRoutes';
import { initSocket } from './socket';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const io = initSocket(httpServer);

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/agent-management');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize Socket.io
initializeSocket(io);

// Routes
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/quota', quotaRoutes);
app.use('/api/passport', passportRoutes);
app.use('/api/credit', creditRoutes);
app.use('/api/quota-request', quotaRequestRoutes);
app.use('/api/settings', settingsRoutes); // Public settings endpoint
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await runDatabaseSeed(); // Auto-seed database on startup
  await initializePool();
  setupCronJobs();
  
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  });
};

startServer();

