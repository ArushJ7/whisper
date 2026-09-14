import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_please_change_in_production';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Default fallback hash for 'password' if neither env var is provided
const FALLBACK_HASH = bcrypt.hashSync('password', 10);

export const adminController = {
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required' });
      }

      if (username !== ADMIN_USERNAME) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      let match = false;
      if (ADMIN_PASSWORD_HASH) {
        match = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
      } else if (ADMIN_PASSWORD) {
        match = password === ADMIN_PASSWORD;
      } else {
        match = await bcrypt.compare(password, FALLBACK_HASH);
      }

      if (!match) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      // Generate JWT
      const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });

      // Set cookie
      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
      });

      res.status(200).json({ success: true, message: 'Logged in successfully' });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      res.clearCookie('admin_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
};
