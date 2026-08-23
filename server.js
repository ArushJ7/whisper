import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import secretRoutes from './routes/secretRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Configure EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Web application view route
app.get('/', (req, res) => {
  res.render('index');
});

// REST API Endpoints Router
app.use('/api/secrets', secretRoutes);

// Catch-all 404 Handler for undefined routes
app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` 🤫 WHISPER SECRETS APP IS RUNNING!`);
  console.log(` 🚀 Server listening on: http://localhost:${PORT}`);
  console.log(` 📡 REST API available at: http://localhost:${PORT}/api/secrets`);
  console.log(`====================================================`);
});
