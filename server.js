import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import secretRoutes from './routes/secretRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { adminController } from './controllers/adminController.js';
import { requireAdmin } from './middleware/authMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';
import pool, { initDatabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// Apply rate limiting to API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { success: false, error: 'Too many requests, please try again later.' }
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Configure EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Web application view route
app.get('/', (req, res) => {
  res.render('index');
});

// Admin View & Authentication Routes
app.get('/admin', (req, res) => {
  res.redirect('/admin/dashboard');
});

app.get('/admin/login', (req, res) => {
  res.render('admin-login');
});

app.post('/admin/login', apiLimiter, adminController.login);

app.get('/admin/dashboard', requireAdmin, (req, res) => {
  res.render('admin-dashboard');
});

// REST API Endpoints Router
app.use('/api/secrets', apiLimiter, secretRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);

// Catch-all 404 Handler for undefined routes
app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Pre-flight Security Checks
const verifyEnvironmentConfiguration = () => {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET must be defined in production.');
    process.exit(1);
  }

  if (!process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD) {
    console.error('FATAL ERROR: Either ADMIN_PASSWORD_HASH or ADMIN_PASSWORD must be defined for admin authentication.');
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    verifyEnvironmentConfiguration();

    // Verify database connection (without exposing connection details)
    await pool.query('SELECT NOW();');
    console.log('PostgreSQL connected successfully');

    // Ensure database table exists
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` 🤫 WHISPER SECRETS APP IS RUNNING!`);
      console.log(` 🚀 Server listening on: http://localhost:${PORT}`);
      console.log(` 📡 REST API available at: http://localhost:${PORT}/api/secrets`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Database connection or initialization failed:', error.message || error);
    process.exit(1);
  }
};

startServer();
