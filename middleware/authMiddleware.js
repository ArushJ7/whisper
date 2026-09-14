import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export const requireAdmin = (req, res, next) => {
  const token = req.cookies.admin_token;

  if (!token) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
    }
    return res.redirect('/admin/login');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
    }
    return res.redirect('/admin/login');
  }
};
