const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    console.log('🔐 Auth middleware - Header received:', authHeader ? 'Bearer ***' : 'No header');
    
    if (!authHeader) {
      console.log('❌ Auth failed: No token provided');
      return res.status(401).json({ 
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      console.log('❌ Auth failed: Invalid token format');
      return res.status(401).json({ 
        message: 'Access denied. Invalid token format.',
        code: 'INVALID_FORMAT'
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_dev_only';
    console.log('🔑 JWT_SECRET exists:', !!process.env.JWT_SECRET, 'Length:', JWT_SECRET.length);
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token decoded successfully for user:', decoded.userId);
    
    // Get full user data from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      console.log('❌ Auth failed: User not found in DB for ID:', decoded.userId);
      return res.status(401).json({ 
        message: 'Access denied. User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    console.log('👤 User found:', user.email, 'Approved:', user.approved, 'Frozen:', user.frozen);

    // Check if user is approved and not frozen
    if (!user.approved) {
      console.log('❌ Auth failed: Account not approved');
      return res.status(403).json({ 
        message: 'Access denied. Account not approved.',
        code: 'NOT_APPROVED'
      });
    }

    if (user.frozen) {
      console.log('❌ Auth failed: Account is frozen');
      return res.status(403).json({ 
        message: 'Access denied. Account is frozen.',
        code: 'ACCOUNT_FROZEN'
      });
    }

    console.log('✅ Auth successful for user:', user.email);
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      console.log('❌ Auth failed: Invalid token -', error.message);
      return res.status(401).json({ 
        message: 'Access denied. Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      console.log('❌ Auth failed: Token expired -', error.message);
      return res.status(401).json({ 
        message: 'Access denied. Token expired.',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('❌ Authentication middleware error:', error);
    return res.status(500).json({ 
      message: 'Internal server error during authentication.',
      code: 'AUTH_ERROR'
    });
  }
};

// Role-based authorization middleware
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Access denied. Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Optional authentication middleware (for routes that work with or without auth)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      req.user = null;
      req.userId = null;
      return next();
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      req.user = null;
      req.userId = null;
      return next();
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_dev_only';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.userId).select('-password');
    if (user && user.approved && !user.frozen) {
      req.user = user;
      req.userId = user._id;
    } else {
      req.user = null;
      req.userId = null;
    }

    next();
  } catch (error) {
    // For optional auth, we don't return errors, just proceed without user
    req.user = null;
    req.userId = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  authorize,
  optionalAuth
};