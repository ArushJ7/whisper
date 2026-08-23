/**
 * Centralized error handler middleware for Express.
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "An unexpected internal server error occurred.";

  console.error(`[Error Handler] ${statusCode} - ${message}`);
  if (err.stack && process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // If request expects JSON (e.g. API endpoint), return JSON response
  if (req.originalUrl.startsWith('/api/') || req.headers.accept?.includes('application/json')) {
    return res.status(statusCode).json({
      success: false,
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Otherwise render user-friendly HTML error page
  res.status(statusCode).render('error', {
    title: `Error ${statusCode}`,
    statusCode,
    message
  });
};
