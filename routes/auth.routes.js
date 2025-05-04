const express = require('express');
const authRouter = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth');


/**
 * @route   GET /api/auth/health
 * @desc    Check if the server is running
 * @access  Public
 */
authRouter.get('/health', (req, res) => {
  res.json({ status: 'ok' }); 
})



/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
authRouter.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get authentication token
 * @access  Public
 */
authRouter.post('/login', authController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate session
 * @access  Private
 */
authRouter.post('/logout', authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
authRouter.get('/me', authMiddleware.protect, authController.getCurrentUser);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
authRouter.put('/profile', authMiddleware.protect, authController.updateProfile);

/**
 * @route   POST /api/auth/password/reset-request
 * @desc    Request password reset email
 * @access  Public
 */
authRouter.post('/password/reset-request', authController.requestPasswordReset);

/**
 * @route   POST /api/auth/password/reset-complete
 * @desc    Complete password reset process
 * @access  Public
 */
authRouter.post('/password/reset-complete', authController.completePasswordReset);

/**
 * @route   POST /api/auth/email/verify
 * @desc    Verify user email address
 * @access  Public
 */
authRouter.post('/email/verify', authController.verifyEmail);

/**
 * @route   GET /api/auth/check
 * @desc    Check if user is authenticated
 * @access  Public
 */
authRouter.get('/check', (req, res) => {
  try {
    // This route will be intercepted by the auth middleware if a token is provided
    // If no token is provided, it will return unauthenticated
    res.json({ authenticated: false });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/auth/check-auth
 * @desc    Check if user is authenticated (protected route)
 * @access  Private
 */
authRouter.get('/check-auth', authMiddleware.protect, (req, res) => {
  res.json({ authenticated: true, user: req.user });
});

module.exports = authRouter;