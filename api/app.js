import express from 'express';
import cors from 'cors';

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

// ==========================================
// MIDDLEWARE
// ==========================================

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// CORS - Allow frontend to connect
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    // In production, allow the Vercel domain and localhost for dev
    if (origin.startsWith('http://localhost:') || origin.endsWith('.vercel.app') || origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    // Allow custom domains
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ==========================================
// ROUTES
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Warung Request API is running on Vercel 🚀',
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
  });
});

export default app;
