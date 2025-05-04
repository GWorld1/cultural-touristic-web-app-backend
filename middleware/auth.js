const jwt = require('jsonwebtoken');
const { account } = require('../config/appwrite');

/**
 * Authentication middleware
 */
const authMiddleware = {
  /**
   * Protect routes - Verifies JWT token and attaches user to request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  protect: async (req, res, next) => {
    try {
      let token;

      // Get token from Authorization header
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }

      // Check if token exists
      if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token provided' });
      }

      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get current user from Appwrite
        try {
          // Check if session is valid in Appwrite
          const currentUser = await account.get();
          
          // Attach user info to request
          req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
          };
          
          next();
        } catch (error) {
          // Session is invalid or expired in Appwrite
          return res.status(401).json({ error: 'Not authorized, session expired' });
        }
      } catch (error) {
        // JWT verification failed
        return res.status(401).json({ error: 'Not authorized, token failed' });
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  },

  /**
   * Restrict access to specific roles
   * @param {...String} roles - Roles allowed to access the route
   * @returns {Function} Middleware function
   */
  restrictTo: (...roles) => {
    return (req, res, next) => {
      // Check if user exists and has a role
      if (!req.user || !req.user.role) {
        return res.status(401).json({ error: 'Not authorized' });
      }

      // Check if user's role is allowed
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Not authorized, insufficient permissions' });
      }

      next();
    };
  },

  /**
   * Optional authentication - Attaches user to request if token is valid, but doesn't block request if no token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  optional: async (req, res, next) => {
    try {
      let token;

      // Get token from Authorization header
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }

      // If no token, continue without authentication
      if (!token) {
        return next();
      }

      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get current user from Appwrite
        try {
          // Check if session is valid in Appwrite
          const currentUser = await account.get();
          
          // Attach user info to request
          req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
          };
        } catch (error) {
          // Session is invalid but we continue without authentication
          console.log('Invalid session, continuing as unauthenticated');
        }
      } catch (error) {
        // JWT verification failed but we continue without authentication
        console.log('Invalid token, continuing as unauthenticated');
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = authMiddleware;