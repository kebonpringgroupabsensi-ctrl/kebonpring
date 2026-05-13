import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

// Route imports
import authRoutes from './routes/auth.js';
import branchRoutes from './routes/branches.js';
import employeeRoutes from './routes/employees.js';
import shiftRoutes from './routes/shifts.js';
import attendanceRoutes from './routes/attendances.js';
import leaveRoutes from './routes/leaves.js';
import settingsRoutes from './routes/settings.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ==========================================
// MIDDLEWARE
// ==========================================

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// CORS - Allow frontend to connect
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
  'https://aplikasiabsensiwarung.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(o => origin.startsWith(o)) || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.warn(`CORS blocked for origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request logging (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
  });
}

// ==========================================
// ROUTES
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Warung Request API is running 🚀',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/attendances', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route tidak ditemukan.',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Terjadi kesalahan internal pada server.',
    ...(process.env.NODE_ENV !== 'production' && { details: err.message }),
  });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   🍽️  Warung Request API Server          ║
  ║   Running on: http://localhost:${PORT}      ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}            ║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
